const vendorService = require('../services/vendorService');

/**
 * Contrôleur pour les routes des vendeurs
 */
class VendorController {
    /**
     * Récupère tous les vendeurs avec pagination
     */
    async getAllVendors(req, res, next) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const sortBy = req.query.sortBy || 'cveCount';
            const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

            const result = await vendorService.getAllVendors(page, limit, sortBy, sortOrder);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Récupère un vendeur par son ID
     */
    async getVendorById(req, res, next) {
        try {
            const vendorId = req.params.id;
            const vendor = await vendorService.getVendorById(vendorId);

            if (!vendor) {
                return res.status(404).json({
                    error: true,
                    message: `Vendeur avec l'ID ${vendorId} non trouvé`
                });
            }

            res.json(vendor);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Récupère un vendeur par son nom
     */
    async getVendorByName(req, res, next) {
        try {
            const name = req.params.name;
            const vendor = await vendorService.getVendorByName(name);

            if (!vendor) {
                return res.status(404).json({
                    error: true,
                    message: `Vendeur avec le nom ${name} non trouvé`
                });
            }

            res.json(vendor);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Recherche les vendeurs par texte
     */
    async searchVendors(req, res, next) {
        try {
            const searchTerm = req.query.q;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;

            if (!searchTerm) {
                return res.status(400).json({
                    error: true,
                    message: 'Le paramètre de recherche q est requis'
                });
            }

            const result = await vendorService.searchVendors(searchTerm, page, limit);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Récupère les produits d'un vendeur
     */
    async getVendorProducts(req, res, next) {
        try {
            const vendorId = req.params.id;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;

            const result = await vendorService.getVendorProducts(vendorId, page, limit);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Récupère les statistiques des vendeurs
     */
    async getVendorStats(req, res, next) {
        try {
            const stats = await vendorService.getVendorStats();
            res.json(stats);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Récupère les statistiques des CVE pour un vendeur
     */
    async getVendorCVEStats(req, res, next) {
        try {
            const vendorId = req.params.id;
            const stats = await vendorService.getVendorCVEStats(vendorId);
            res.json(stats);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new VendorController();