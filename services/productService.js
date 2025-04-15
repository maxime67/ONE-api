const Product = require('../models/productModel');
const Vendor = require('../models/vendorModel');
const CVE = require('../models/cveModel');

/**
 * Service pour gérer les opérations sur les produits
 */
class ProductService {
    /**
     * Récupère tous les produits avec pagination
     */
    async getAllProducts(page = 1, limit = 20, sortBy = 'cveCount', sortOrder = -1) {
        const skip = (page - 1) * limit;
        const sort = {};
        sort[sortBy] = sortOrder;

        const total = await Product.countDocuments();
        const products = await Product.find()
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .populate('vendor', 'name');

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
     * Récupère un produit par son ID
     */
    async getProductById(productId) {
        return await Product.findById(productId).populate('vendor', 'name');
    }

    /**
     * Récupère un produit par son nom et vendeur
     */
    async getProductByNameAndVendor(productName, vendorId) {
        return await Product.findOne({
            name: { $regex: new RegExp(productName, 'i') },
            vendor: vendorId
        }).populate('vendor', 'name');
    }

    /**
     * Recherche de produits par texte
     */
    async searchProducts(searchTerm, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const query = {
            $or: [
                { name: { $regex: searchTerm, $options: 'i' } },
                { vendorName: { $regex: searchTerm, $options: 'i' } }
            ]
        };

        const total = await Product.countDocuments(query);
        const products = await Product.find(query)
            .sort({ cveCount: -1 })
            .skip(skip)
            .limit(limit)
            .populate('vendor', 'name');

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
     * Récupère les CVE qui affectent un produit
     */
    async getProductCVEs(productId, page = 1, limit = 20) {
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
     * Récupère les versions affectées pour un produit
     */
    async getProductVersions(productId) {
        const product = await Product.findById(productId);
        if (!product) {
            throw new Error('Produit non trouvé');
        }

        return {
            productName: product.name,
            vendorName: product.vendorName,
            versions: product.versions
        };
    }

    /**
     * Obtient les statistiques des produits
     */
    async getProductStats() {
        const totalProducts = await Product.countDocuments();

        // Top produits par nombre de CVE
        const topProductsByCVE = await Product.find()
            .sort({ cveCount: -1 })
            .limit(10)
            .populate('vendor', 'name');

        // Produits récemment affectés
        const recentlyAffectedProducts = await Product.find()
            .sort({ lastSeen: -1 })
            .limit(10)
            .populate('vendor', 'name');

        return {
            total: totalProducts,
            topByCVE: topProductsByCVE,
            recentlyAffected: recentlyAffectedProducts
        };
    }

    /**
     * Récupère les statistiques des CVE par produit
     */
    async getProductCVEStats(productId) {
        const product = await Product.findById(productId).populate('vendor', 'name');
        if (!product) {
            throw new Error('Produit non trouvé');
        }

        // Trouver tous les CVE associés à ce produit
        const cves = await CVE.find({ 'affectedProducts.product': productId })
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

        // Compter les versions affectées et non affectées
        const versionStats = {
            affected: product.versions.filter(v => v.affected).length,
            notAffected: product.versions.filter(v => !v.affected).length,
            total: product.versions.length
        };

        return {
            product: product.name,
            vendor: product.vendor ? product.vendor.name : product.vendorName,
            cveCount: product.cveCount,
            firstSeen: product.firstSeen,
            lastSeen: product.lastSeen,
            severityDistribution,
            avgCvssScore,
            cveTimeline,
            versionStats
        };
    }
}

module.exports = new ProductService();