const CVE = require('../models/cveModel');
const Vendor = require('../models/vendorModel');
const Product = require('../models/productModel');

/**
 * Service pour les fonctionnalités de recherche
 */
class SearchService {
    /**
     * Recherche globale sur tous les modèles
     */
    async globalSearch(searchTerm, page = 1, limit = 20) {
        const skip = (page - 1) * limit;

        // Recherche dans les CVE
        const cvesQuery = {
            $or: [
                { cveId: { $regex: searchTerm, $options: 'i' } },
                { description: { $regex: searchTerm, $options: 'i' } }
            ]
        };

        // Recherche dans les vendeurs
        const vendorsQuery = {
            name: { $regex: searchTerm, $options: 'i' }
        };

        // Recherche dans les produits
        const productsQuery = {
            $or: [
                { name: { $regex: searchTerm, $options: 'i' } },
                { vendorName: { $regex: searchTerm, $options: 'i' } }
            ]
        };

        // Exécuter les recherches
        const [cves, cveCount, vendors, vendorCount, products, productCount] = await Promise.all([
            CVE.find(cvesQuery).select('-raw_data').sort({ publishedDate: -1 }).skip(skip).limit(limit),
            CVE.countDocuments(cvesQuery),
            Vendor.find(vendorsQuery).sort({ cveCount: -1 }).skip(skip).limit(limit),
            Vendor.countDocuments(vendorsQuery),
            Product.find(productsQuery).populate('vendor', 'name').sort({ cveCount: -1 }).skip(skip).limit(limit),
            Product.countDocuments(productsQuery)
        ]);

        // Calculer le total des résultats
        const totalResults = cveCount + vendorCount + productCount;

        return {
            results: {
                cves,
                vendors,
                products
            },
            counts: {
                cves: cveCount,
                vendors: vendorCount,
                products: productCount,
                total: totalResults
            },
            pagination: {
                page,
                limit,
                totalPages: Math.ceil(totalResults / limit)
            }
        };
    }

    /**
     * Recherche avancée de CVE avec filtres multiples
     */
    async advancedSearch(filters, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const query = {};

        // Filtrer par ID CVE
        if (filters.cveId) {
            query.cveId = { $regex: filters.cveId, $options: 'i' };
        }

        // Filtrer par description
        if (filters.description) {
            query.description = { $regex: filters.description, $options: 'i' };
        }

        // Filtrer par vendeur
        if (filters.vendor) {
            query['affectedProducts.vendorName'] = { $regex: filters.vendor, $options: 'i' };
        }

        // Filtrer par produit
        if (filters.product) {
            query['affectedProducts.productName'] = { $regex: filters.product, $options: 'i' };
        }

        // Filtrer par niveau de sévérité
        if (filters.severity) {
            switch(filters.severity.toUpperCase()) {
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
            }
        }

        // Filtrer par score CVSS minimum
        if (filters.minCvss) {
            query.cvssScore = { ...query.cvssScore, $gte: parseFloat(filters.minCvss) };
        }

        // Filtrer par score CVSS maximum
        if (filters.maxCvss) {
            query.cvssScore = { ...query.cvssScore, $lte: parseFloat(filters.maxCvss) };
        }

        // Filtrer par date de publication (début)
        if (filters.startDate) {
            query.publishedDate = { $gte: new Date(filters.startDate) };
        }

        // Filtrer par date de publication (fin)
        if (filters.endDate) {
            query.publishedDate = { ...query.publishedDate, $lte: new Date(filters.endDate) };
        }

        // Filtrer par CWE ID
        if (filters.cweId) {
            query['problemType.cweId'] = { $regex: filters.cweId, $options: 'i' };
        }

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
     * Suggère des termes pour l'autocomplétion
     */
    async getSuggestions(prefix, type = 'all', limit = 10) {
        const results = {};

        if (type === 'all' || type === 'cve') {
            results.cves = await CVE.find({ cveId: { $regex: `^${prefix}`, $options: 'i' } })
                .select('cveId')
                .limit(limit);
        }

        if (type === 'all' || type === 'vendor') {
            results.vendors = await Vendor.find({ name: { $regex: `^${prefix}`, $options: 'i' } })
                .select('name')
                .limit(limit);
        }

        if (type === 'all' || type === 'product') {
            results.products = await Product.find({ name: { $regex: `^${prefix}`, $options: 'i' } })
                .select('name vendorName')
                .limit(limit);
        }

        return results;
    }
}

module.exports = new SearchService();