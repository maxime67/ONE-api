const CVE = require('../models/cveModel');
const Product = require('../models/productModel');
const Vendor = require('../models/vendorModel');

/**
 * Service pour gérer les opérations sur les CVE
 */
class CVEService {
    /**
     * Récupère tous les CVE avec pagination
     */
    async getAllCVEs(page = 1, limit = 20, sortBy = 'publishedDate', sortOrder = -1) {
        const skip = (page - 1) * limit;
        const sort = {};
        sort[sortBy] = sortOrder;

        const total = await CVE.countDocuments();
        const cves = await CVE.find()
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .select('-raw_data'); // Exclure les données brutes pour alléger la réponse

        return {
            cves,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Récupère un CVE par son ID
     */
    async getCVEById(cveId) {
        return await CVE.findOne({ cveId })
            .populate({
                path: 'affectedProducts.product',
                select: 'name vendorName versions'
            });
    }

    /**
     * Récupère les CVE avec un score CVSS supérieur à un seuil
     */
    async getCVEsBySeverity(severity, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        let query = {};

        // Mapping de la sévérité textuelle vers des plages de scores CVSS
        switch (severity.toUpperCase()) {
            case 'CRITICAL':
                query.cvssScore = { $gte: 9.0 };
                break;
            case 'HIGH':
                query.cvssScore = { $gte: 7.0, $lt: 9.0 };
                break;
            case 'MEDIUM':
                query.cvssScore = { $gte: 4.0, $lt: 7.0 };
                break;
            case 'LOW':
                query.cvssScore = { $gt: 0, $lt: 4.0 };
                break;
            default:
                // Si une valeur numérique est fournie
                if (!isNaN(severity)) {
                    query.cvssScore = { $gte: parseFloat(severity) };
                }
        }

        const total = await CVE.countDocuments(query);
        const cves = await CVE.find(query)
            .sort({ cvssScore: -1, publishedDate: -1 })
            .skip(skip)
            .limit(limit)
            .select('-raw_data');

        return {
            cves,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Récupère les CVE affectant un produit spécifique
     */
    async getCVEsByProduct(productId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const query = { 'affectedProducts.product': productId };

        const total = await CVE.countDocuments(query);
        const cves = await CVE.find(query)
            .sort({ publishedDate: -1 })
            .skip(skip)
            .limit(limit)
            .select('-raw_data');

        return {
            cves,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Récupère les CVE affectant un vendor spécifique
     */
    async getCVEsByVendor(vendorId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const query = { 'affectedProducts.vendor': vendorId };

        const total = await CVE.countDocuments(query);
        const cves = await CVE.find(query)
            .sort({ publishedDate: -1 })
            .skip(skip)
            .limit(limit)
            .select('-raw_data');

        return {
            cves,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Recherche de CVE par texte dans la description
     */
    async searchCVEs(searchTerm, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const query = {
            $or: [
                { description: { $regex: searchTerm, $options: 'i' } },
                { cveId: { $regex: searchTerm, $options: 'i' } }
            ]
        };

        const total = await CVE.countDocuments(query);
        const cves = await CVE.find(query)
            .sort({ publishedDate: -1 })
            .skip(skip)
            .limit(limit)
            .select('-raw_data');

        return {
            cves,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Obtient les statistiques sur les CVE
     */
    async getCVEStats() {
        const totalCVEs = await CVE.countDocuments();

        const severityCounts = await CVE.aggregate([
            {
                $match: { cvssScore: { $exists: true, $ne: null } }
            },
            {
                $group: {
                    _id: {
                        $switch: {
                            branches: [
                                { case: { $gte: ["$cvssScore", 9.0] }, then: "CRITICAL" },
                                { case: { $gte: ["$cvssScore", 7.0] }, then: "HIGH" },
                                { case: { $gte: ["$cvssScore", 4.0] }, then: "MEDIUM" },
                                { case: { $gt: ["$cvssScore", 0] }, then: "LOW" }
                            ],
                            default: "NONE"
                        }
                    },
                    count: { $sum: 1 }
                }
            }
        ]);

        const recentCVEs = await CVE.countDocuments({
            publishedDate: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        });

        return {
            total: totalCVEs,
            bySeverity: severityCounts.reduce((acc, curr) => {
                acc[curr._id] = curr.count;
                return acc;
            }, {}),
            recentCount: recentCVEs
        };
    }

    /**
     * Récupère les statistiques temporelles des CVE
     */
    async getCVETimeline(period = 'month', limit = 12) {
        let groupBy;
        let sortBy;
        let dateFormat;

        switch(period) {
            case 'day':
                groupBy = {
                    year: { $year: "$publishedDate" },
                    month: { $month: "$publishedDate" },
                    day: { $dayOfMonth: "$publishedDate" }
                };
                dateFormat = "%Y-%m-%d";
                break;
            case 'week':
                groupBy = {
                    year: { $year: "$publishedDate" },
                    week: { $week: "$publishedDate" }
                };
                dateFormat = "%Y-W%V";
                break;
            case 'month':
            default:
                groupBy = {
                    year: { $year: "$publishedDate" },
                    month: { $month: "$publishedDate" }
                };
                dateFormat = "%Y-%m";
                break;
        }

        const timeline = await CVE.aggregate([
            {
                $match: {
                    publishedDate: { $exists: true, $ne: null }
                }
            },
            {
                $group: {
                    _id: groupBy,
                    count: { $sum: 1 },
                    avgCvssScore: { $avg: "$cvssScore" }
                }
            },
            {
                $sort: { "_id.year": -1, "_id.month": -1, "_id.day": -1, "_id.week": -1 }
            },
            {
                $limit: limit
            },
            {
                $project: {
                    _id: 0,
                    period: {
                        $dateToString: {
                            format: dateFormat,
                            date: {
                                $dateFromParts: {
                                    year: "$_id.year",
                                    month: { $ifNull: ["$_id.month", 1] },
                                    day: { $ifNull: ["$_id.day", 1] }
                                }
                            }
                        }
                    },
                    count: 1,
                    avgCvssScore: { $round: ["$avgCvssScore", 2] }
                }
            }
        ]);

        return timeline.reverse(); // Pour avoir l'ordre chronologique
    }
}

module.exports = new CVEService();