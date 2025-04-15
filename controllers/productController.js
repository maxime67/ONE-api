const productService = require('../services/productService');

/**
 * Contrôleur pour les routes des produits
 */
class ProductController {
    /**
     * Récupère tous les produits avec pagination
     */
    async getAllProducts(req, res, next) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const sortBy = req.query.sortBy || 'cveCount';
            const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

            const result = await productService.getAllProducts(page, limit, sortBy, sortOrder);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Récupère un produit par son ID
     */
    async getProductById(req, res, next) {
        try {
            const productId = req.params.id;
            const product = await productService.getProductById(productId);

            if (!product) {
                return res.status(404).json({
                    error: true,
                    message: `Produit avec l'ID ${productId} non trouvé`
                });
            }

            res.json(product);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Récupère un produit par son nom et son vendeur
     */
    async getProductByNameAndVendor(req, res, next) {
        try {
            const { productName, vendorId } = req.params;
            const product = await productService.getProductByNameAndVendor(productName, vendorId);

            if (!product) {
                return res.status(404).json({
                    error: true,
                    message: `Produit ${productName} pour le vendeur ${vendorId} non trouvé`
                });
            }

            res.json(product);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Recherche les produits par texte
     */
    async searchProducts(req, res, next) {
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

            const result = await productService.searchProducts(searchTerm, page, limit);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Récupère les CVE pour un produit
     */
    async getProductCVEs(req, res, next) {
        try {
            const productId = req.params.id;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;

            const result = await productService.getProductCVEs(productId, page, limit);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Récupère les versions d'un produit
     */
    async getProductVersions(req, res, next) {
        try {
            const productId = req.params.id;
            const versions = await productService.getProductVersions(productId);
            res.json(versions);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Récupère les statistiques des produits
     */
    async getProductStats(req, res, next) {
        try {
            const stats = await productService.getProductStats();
            res.json(stats);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Récupère les statistiques des CVE pour un produit
     */
    async getProductCVEStats(req, res, next) {
        try {
            const productId = req.params.id;
            const stats = await productService.getProductCVEStats(productId);
            res.json(stats);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new ProductController();