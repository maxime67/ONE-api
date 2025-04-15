const Vendor = require('../models/vendorModel');
const Product = require('../models/productModel');
const CVE = require('../models/cveModel');

/**
 * Service pour gérer les opérations sur les vendeurs
 */
class VendorService {
    /**
     * Récupère tous les vendeurs avec pagination
     */
    async getAllVendors(page = 1, limit = 20, sortBy = 'cveCount', sortOrder = -1) {
        const skip = (page - 1) * limit;
        const sort = {};
        sort[sortBy] = sortOrder;

        const total = await Vendor.countDocuments();
        const vendors = await Vendor.find()
            .sort(sort)
            .skip(skip)
            .limit(limit);

        return {
            vendors,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Récupère un vendeur par son ID
     */
    async getVendorById(vendorId) {
        return await Vendor.findById(vendorId);
    }

    /**
     * Récupère un vendeur par son nom
     */
    async getVendorByName(name) {
        return await Vendor.findOne({ name: { $regex: new RegExp(name, 'i') } });
    }

    /**
     * Recherche de vendeurs par texte
     */
    async searchVendors(searchTerm, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const query = {
            name: { $regex: searchTerm, $options: 'i' }
        };

        const total = await Vendor.countDocuments(query);
        const vendors = await Vendor.find(query)
            .sort({ cveCount: -1 })
            .skip(skip)
            .limit(limit);

        return {
            vendors,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Récupère les produits d'un vendeur
     */
    async getVendorProducts(vendorId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const query = { vendor: vendorId };

        const total = await Product.countDocuments(query);
        const products = await Product.find(query)
            .sort({ cveCount: -1 })
            .skip(skip)
            .limit(limit);

        return {
            products,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Obtient les statistiques des vendeurs
     */
    async getVendorStats() {
        const totalVendors = await Vendor.countDocuments();

        // Top vendeurs par nombre de CVE
        const topVendorsByCVE = await Vendor.find()
            .sort({ cveCount: -1 })
            .limit(10);

        // Top vendeurs par nombre de produits
        const topVendorsByProducts = await Vendor.find()
            .sort({ productCount: -1 })
            .limit(10);

        // Vendeurs récemment affectés
        const recentlyAffectedVendors = await Vendor.find()
            .sort({ lastSeen: -1 })
            .limit(10);

        return {
            total: totalVendors,
            topByCVE: topVendorsByCVE,
            topByProducts: topVendorsByProducts,
            recentlyAffected: recentlyAffectedVendors
        };
    }

    /**
     * Récupère les statistiques des CVE par vendeur
     */
    async getVendorCVEStats(vendorId) {
        const vendor = await Vendor.findById(vendorId);
        if (!vendor) {
            throw new Error('Vendeur non trouvé');
        }

        // Trouver tous les CVE associés à ce vendeur
        const cves = await CVE.find({ 'affectedProducts.vendor': vendorId })
            .select('cvssScore publishedDate');

        // Analyser la distribution de sévérité
        const severityDistribution = {
            CRITICAL: 0,
            HIGH: 0,
            MEDIUM: 0,
            LOW: 0,
            NONE: 0
        };

        cves.forEach(cve => {
            if (!cve.cvssScore) {
                severityDistribution.NONE++;
            } else if (cve.cvssScore >= 9.0) {
                severityDistribution.CRITICAL++;
            } else if (cve.cvssScore >= 7.0) {
                severityDistribution.HIGH++;
            } else if (cve.cvssScore >= 4.0) {
                severityDistribution.MEDIUM++;
            } else {
                severityDistribution.LOW++;
            }
        });

        // Calculer le score CVSS moyen
        let totalScore = 0;
        let cveWithScore = 0;

        cves.forEach(cve => {
            if (cve.cvssScore) {
                totalScore += cve.cvssScore;
                cveWithScore++;
            }
        });

        const avgCvssScore = cveWithScore > 0 ? (totalScore / cveWithScore).toFixed(2) : 0;

        // Calculer la tendance temporelle des CVE
        const now = new Date();
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(now.getFullYear() - 1);

        const cveTimeline = [];
        for (let i = 0; i < 12; i++) {
            const month = new Date(oneYearAgo);
            month.setMonth(oneYearAgo.getMonth() + i);

            const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
            const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);

            const count = cves.filter(cve =>
                cve.publishedDate >= startOfMonth && cve.publishedDate <= endOfMonth
            ).length;

            cveTimeline.push({
                month: `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`,
                count
            });
        }

        return {
            vendor: vendor.name,
            cveCount: vendor.cveCount,
            productCount: vendor.productCount,
            firstSeen: vendor.firstSeen,
            lastSeen: vendor.lastSeen,
            severityDistribution,
            avgCvssScore,
            cveTimeline
        };
    }
}

module.exports = new VendorService();