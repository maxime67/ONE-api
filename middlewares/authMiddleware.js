const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

/**
 * Middleware pour vérifier le token JWT
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction next de Express
 */
const authenticateToken = (req, res, next) => {
    // Récupérer le header d'autorisation
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Accès non autorisé. Token manquant.'
        });
    }

    // Vérifier le token
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
        if (err) {
            return res.status(403).json({
                success: false,
                message: 'Token invalide ou expiré'
            });
        }

        // Stocker les données de l'utilisateur dans la requête pour une utilisation ultérieure
        req.user = decodedToken;
        next();
    });
};

/**
 * Middleware pour vérifier si l'utilisateur est administrateur
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction next de Express
 */
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({
            success: false,
            message: 'Accès refusé. Droits d\'administrateur requis.'
        });
    }
};

module.exports = {
    authenticateToken,
    isAdmin
};