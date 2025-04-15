const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { param, query, validationResult } = require('express-validator');

// Middleware de validation des paramètres
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

/**
 * @route   GET /api/products
 * @desc    Récupérer tous les produits avec pagination
 * @access  Public
 */
router.get('/', [
    query('page').optional().isInt({ min: 1 }).withMessage('La page doit être un entier positif'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('La limite doit être un entier entre 1 et 100'),
    query('sortBy').optional().isString().withMessage('Le champ de tri doit être une chaîne de caractères'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('L\'ordre de tri doit être "asc" ou "desc"')
], validate, productController.getAllProducts);

/**
 * @route   GET /api/products/:id
 * @desc    Récupérer un produit par son ID
 * @access  Public
 */
router.get('/:id', [
    param('id').isMongoId().withMessage('ID de produit invalide')
], validate, productController.getProductById);

/**
 * @route   GET /api/products/vendor/:vendorId/name/:productName
 * @desc    Récupérer un produit par son nom et son vendeur
 * @access  Public
 */
router.get('/vendor/:vendorId/name/:productName', [
    param('vendorId').isMongoId().withMessage('ID de vendeur invalide'),
    param('productName').isString().withMessage('Le nom du produit doit être une chaîne de caractères')
], validate, productController.getProductByNameAndVendor);

/**
 * @route   GET /api/products/search
 * @desc    Rechercher des produits par texte
 * @access  Public
 */
router.get('/search', [
    query('q').isString().withMessage('Le terme de recherche doit être une chaîne de caractères'),
    query('page').optional().isInt({ min: 1 }).withMessage('La page doit être un entier positif'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('La limite doit être un entier entre 1 et 100')
], validate, productController.searchProducts);

/**
 * @route   GET /api/products/:id/cves
 * @desc    Récupérer les CVE pour un produit
 * @access  Public
 */
router.get('/:id/cves', [
    param('id').isMongoId().withMessage('ID de produit invalide'),
    query('page').optional().isInt({ min: 1 }).withMessage('La page doit être un entier positif'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('La limite doit être un entier entre 1 et 100')
], validate, productController.getProductCVEs);

/**
 * @route   GET /api/products/:id/versions
 * @desc    Récupérer les versions d'un produit
 * @access  Public
 */
router.get('/:id/versions', [
    param('id').isMongoId().withMessage('ID de produit invalide')
], validate, productController.getProductVersions);

/**
 * @route   GET /api/products/stats
 * @desc    Récupérer les statistiques des produits
 * @access  Public
 */
router.get('/stats/summary', productController.getProductStats);

/**
 * @route   GET /api/products/:id/stats
 * @desc    Récupérer les statistiques des CVE pour un produit
 * @access  Public
 */
router.get('/:id/stats', [
    param('id').isMongoId().withMessage('ID de produit invalide')
], validate, productController.getProductCVEStats);

module.exports = router;