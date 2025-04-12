// Variables globales
let redCategories = {};
let blackCategories = {};
let selectedCard = null;
let isAnimating = false; // Flag pour suivre l'état d'animation
let hoverTimers = {}; // Pour stocker les timers de survol
let currentProduction = null; // Pour stocker la production actuellement affichée
let youtubePlayer = null; // Pour stocker l'instance du lecteur YouTube
let weightedCategories = []; // Tableau pondéré précalculé pour la sélection aléatoire
let youtubeAPILoaded = false; // Flag pour suivre si l'API YouTube est déjà chargée
let isLoadingVideo = false; // Flag pour suivre si une vidéo est en cours de chargement
let videoLoadingCancelled = false; // Flag pour indiquer si le chargement a été annulé

// Variables pour la sélection aléatoire améliorée
let usedRedProductions = []; // Pour stocker les productions rouges déjà utilisées
let lastBlackProduction = null; // Pour stocker la dernière production noire sélectionnée
let lastBlackCategory = null; // Pour stocker la dernière catégorie noire sélectionnée
let cardsSinceLastRed = 0; // Compteur de cartes depuis la dernière carte rouge

// Initialize all DOM elements
let domElements;

function initializeDOMElements() {
    domElements = {
    title: document.querySelector('h1'),
    prodTitle: document.querySelector('.prod-title'),
    bpmText: document.querySelector('.bpm-text'),
    bottomText: document.querySelector('.bottom-text'),
    restartText: document.querySelector('.restart-text'),
        videoContainer: document.querySelector('.video-container'),
    buyButton: document.querySelector('.buy-button'),
    downloadButton: document.querySelector('.download-button'),
        cards: document.querySelectorAll('.card')
    };
}

// Charger l'API YouTube
function loadYouTubeAPI() {
    if (youtubeAPILoaded) {
        console.log("API YouTube déjà chargée");
        return Promise.resolve();
    }
    
    return new Promise((resolve) => {
        console.log("Chargement de l'API YouTube...");
        // Créer la balise script pour l'API YouTube
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        
        // Définir une fonction temporaire pour être notifié quand l'API est prête
        window.onYouTubeIframeAPIReady = function() {
            console.log("API YouTube prête");
            youtubeAPILoaded = true;
            resolve();
        };
        
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    });
}

// Fonction pour générer les cartes décoratives
function createDecorativeCards() {
    const container = document.querySelector('.decorative-cards');
    
    // Vider le conteneur au cas où
    container.innerHTML = '';
    
    // Créer le nombre approprié de cartes décoratives
    for (let i = 0; i < 50; i++) {
        const card = document.createElement('div');
        card.className = 'decorative-card';
        container.appendChild(card);
    }
    
    // Appliquer la mise à l'échelle initiale
    updateDecorativeCards();
    
    console.log("Cartes décoratives générées dynamiquement");
}

// Fonction pour mettre à jour les cartes décoratives avec la mise à l'échelle
function updateDecorativeCards() {
    const scaleRatio = getUniformScaleRatio();
    const cardWidth = 160 * scaleRatio; // Largeur de base: 130px → 160px (encore +23%)
    const cardHeight = 256 * scaleRatio; // Hauteur de base: 208px → 256px (encore +23%)
    
    // Calcul des marges pour centrer le contenu
    const referenceWidth = 1920;
    const referenceHeight = 1080;
    const scaledContentWidth = referenceWidth * scaleRatio;
    const scaledContentHeight = referenceHeight * scaleRatio;
    const marginHorizontal = (window.innerWidth - scaledContentWidth) / 2;
    const marginVertical = (window.innerHeight - scaledContentHeight) / 2;
    
    // Positions de référence des cartes à gauche
    const leftPositions = [
        { left: 2, top: -5, rotate: -32 }, { left: 1, top: 1, rotate: 24 },
        { left: 4, top: 6, rotate: -15 }, { left: 0, top: 13, rotate: 45 },
        { left: 3, top: 18, rotate: -28 }, { left: 5, top: 25, rotate: 18 },
        { left: 2, top: 40, rotate: -38 }, { left: 6, top: 52, rotate: 35 },
        { left: 3, top: 65, rotate: -22 }, { left: 7, top: 82, rotate: 28 },
        { left: 9, top: -3, rotate: -42 }, { left: 11, top: 4, rotate: 37 },
        { left: 8, top: 11, rotate: -19 }, { left: 12, top: 16, rotate: 31 },
        { left: 7, top: 34, rotate: -25 }, { left: 13, top: 45, rotate: 43 },
        { left: 9, top: 58, rotate: -33 }, { left: 14, top: 72, rotate: 21 },
        { left: 10, top: 85, rotate: -27 }, { left: 15, top: 89, rotate: 39 },
        { left: 15, top: -4, rotate: -41 }, { left: 14, top: 8, rotate: 29 },
        { left: 15, top: 15, rotate: -23 }, { left: 13, top: 78, rotate: 34 },
        { left: 15, top: 92, rotate: -36 }
    ];
    
    // Positions de référence des cartes à droite
    const rightPositions = [
        { right: 2, top: -5, rotate: 38 }, { right: 1, top: 1, rotate: -28 },
        { right: 4, top: 6, rotate: 22 }, { right: 0, top: 13, rotate: -42 },
        { right: 3, top: 18, rotate: 25 }, { right: 5, top: 25, rotate: -23 },
        { right: 2, top: 40, rotate: 33 }, { right: 6, top: 52, rotate: -31 },
        { right: 3, top: 65, rotate: 27 }, { right: 7, top: 82, rotate: -33 },
        { right: 9, top: -3, rotate: 37 }, { right: 11, top: 4, rotate: -41 },
        { right: 8, top: 11, rotate: 24 }, { right: 12, top: 16, rotate: -27 },
        { right: 7, top: 34, rotate: 31 }, { right: 13, top: 45, rotate: -38 },
        { right: 9, top: 58, rotate: 28 }, { right: 14, top: 72, rotate: -25 },
        { right: 10, top: 85, rotate: 32 }, { right: 15, top: 89, rotate: -35 },
        { right: 15, top: -4, rotate: 36 }, { right: 14, top: 8, rotate: -34 },
        { right: 15, top: 15, rotate: 29 }, { right: 13, top: 78, rotate: -39 },
        { right: 15, top: 92, rotate: 41 }
    ];
    
    // Référence à la largeur du conteneur pour calculer les pourcentages
    const containerWidth = 100; // 100% du conteneur
    const containerHeight = 100; // 100% du conteneur
    
    // Multiplicateur pour décaler davantage les cartes vers l'extérieur
    const spreadMultiplier = 1; // Augmenté de 1.5 à 2.5 pour écarter beaucoup plus les cartes
    
    // Valeur minimale pour s'assurer que les cartes ne soient pas trop proches du centre
    const minLeftPosition = 5; // Pourcentage minimal de la largeur de l'écran pour les cartes à gauche
    const minRightPosition = 5; // Pourcentage minimal de la largeur de l'écran pour les cartes à droite
    
    // Appliquer la taille et la position mise à l'échelle à toutes les cartes décoratives
    const decorativeCards = document.querySelectorAll('.decorative-card');
    
    decorativeCards.forEach((card, index) => {
        // Appliquer la taille
        card.style.width = `${cardWidth}px`;
        card.style.height = `${cardHeight}px`;
        // Utiliser la variable CSS pour le rayon de bordure - elle est mise à jour par updateGlobalCSSVariables
        // Ne pas définir directement le style.borderRadius ici
        card.style.boxShadow = `0 ${4 * scaleRatio}px ${15 * scaleRatio}px rgba(0,0,0,0.3)`;
        
        // Déterminer si la carte est à gauche ou à droite
        let position;
        if (index < 25) {
            position = leftPositions[index];
            // Position relative pour les cartes du côté gauche
            const topPercent = (position.top / 100) * containerHeight;
            
            // Position directement par rapport au bord gauche de la fenêtre
            // Assurer une valeur minimale pour éloigner les cartes trop proches du centre
            let leftValue = Math.max(position.left, minLeftPosition);
            const leftAbsolutePos = (leftValue * spreadMultiplier) / 100 * window.innerWidth;
            card.style.left = `${leftAbsolutePos}px`;
            card.style.top = `${marginVertical + (topPercent * referenceHeight * scaleRatio) / 100}px`;
            card.style.right = 'auto';
        } else {
            position = rightPositions[index - 25];
            // Position relative pour les cartes du côté droit
            const topPercent = (position.top / 100) * containerHeight;
            
            // Position directement par rapport au bord droit de la fenêtre
            // Assurer une valeur minimale pour éloigner les cartes trop proches du centre
            let rightValue = Math.max(position.right, minRightPosition);
            const rightAbsolutePos = (rightValue * spreadMultiplier) / 100 * window.innerWidth;
            card.style.right = `${rightAbsolutePos}px`;
            card.style.top = `${marginVertical + (topPercent * referenceHeight * scaleRatio) / 100}px`;
            card.style.left = 'auto';
        }
        
        // Appliquer la rotation
        card.style.transform = `rotate(${position.rotate}deg)`;
    });
}

// Charger le fichier JSON avec la liste des productions
fetch('prods.json')
    .then(response => response.json())
    .then(data => {
        redCategories = data.categories.red;
        blackCategories = data.categories.black;
        
        // Initialiser le tableau pondéré après chargement des données
        initWeightedCategories();
        
        // Générer les cartes décoratives
        createDecorativeCards();
        
        // Initialiser le jeu
        initializeGame();
        
        // Mettre à jour les positions des cartes explicitement
        updateTextPositions();
        updateCardsFan();
        
        // Configurer les effets et écouteurs
        setupCardHoverEffects();
        setupButtonListeners();
        // Ne pas charger l'API YouTube tout de suite, attendre qu'une carte soit sélectionnée
    })
    .catch(error => {
        console.error("Erreur lors du chargement du fichier JSON :", error);
    });

// Configuration des boutons d'achat et de téléchargement
function setupButtonListeners() {
    // Utiliser les références du cache DOM
    domElements.buyButton.addEventListener('click', () => {
        if (currentProduction && currentProduction.buy) {
            window.open(currentProduction.buy, '_blank');
        } else {
            console.log("Aucun lien d'achat disponible pour cette production");
        }
    });
    
    domElements.downloadButton.addEventListener('click', () => {
        if (currentProduction && currentProduction.buy) {
            window.open(currentProduction.buy, '_blank');
        } else {
            console.log("Aucun lien de téléchargement disponible pour cette production");
        }
    });
}

// Configuration des effets de survol des cartes
function setupCardHoverEffects() {
    document.querySelectorAll('.card').forEach(card => {
        const cardInner = card.querySelector('.card-inner');
        const cardId = card.getAttribute('data-index');
        
        // Gestionnaire d'événement mouseenter
        card.addEventListener('mouseenter', () => {
            // Ne pas appliquer d'effet si la carte est en animation
            if (isAnimating || card.classList.contains('selected') || card.classList.contains('fade-out')) {
                return;
            }
            
            // Ajouter la classe vibrating après un délai
            hoverTimers[cardId] = setTimeout(() => {
                cardInner.classList.add('vibrating');
            }, 300); // Correspond au délai d'animation CSS
        });
        
        // Gestionnaire d'événement mouseleave
        card.addEventListener('mouseleave', () => {
            // Annuler le timer si la souris quitte la carte avant le délai
            if (hoverTimers[cardId]) {
                clearTimeout(hoverTimers[cardId]);
                delete hoverTimers[cardId];
            }
            
            // Si la carte vibre, on utilise une transition douce pour revenir à l'état normal
            if (cardInner.classList.contains('vibrating')) {
                // Arrêter l'animation de vibration mais garder le scale temporairement
                cardInner.style.animation = 'none';
                // Forcer un reflow pour appliquer l'arrêt de l'animation
                void cardInner.offsetWidth;
                // Appliquer le scale pour une transition douce
                cardInner.style.transform = 'scale(var(--hover-scale))';
                
                // Après un court délai, revenir à l'échelle normale avec transition
                setTimeout(() => {
                    cardInner.style.transform = 'scale(1)';
                    // Nettoyer les styles après la transition
                    setTimeout(() => {
                        cardInner.style.animation = '';
                        cardInner.style.transform = '';
                        cardInner.classList.remove('vibrating');
                    }, 300); // Durée de la transition
                }, 50);
            } else {
                // Si pas de vibration, simplement supprimer la classe
                cardInner.classList.remove('vibrating');
            }
        });
    });
}

// Fonction commune pour réinitialiser l'interface utilisateur
function resetUI() {
    // Indiquer que tout chargement vidéo en cours doit être annulé
    videoLoadingCancelled = true;
    
    // Grouper les mises à jour DOM pour éviter les reflows multiples
    batchDOMUpdates(() => {
        // S'assurer qu'il n'y a pas de classe instant-hide active
        domElements.videoContainer.classList.remove('instant-hide');
        
        // Masquer la vidéo
        domElements.videoContainer.classList.remove('visible');
        
        // Reset the transform property for the hidden state
        domElements.videoContainer.style.transform = 'translate(-50%, -80%) scale(0.8)';
        
        // Masquer les boutons
        domElements.buyButton.style.opacity = '0';
        domElements.downloadButton.style.opacity = '0';
        
        // Masquer le titre de la production et le BPM
        domElements.prodTitle.classList.remove('visible');
        domElements.prodTitle.classList.add('hidden');
        domElements.bpmText.classList.remove('visible');
        domElements.bpmText.classList.add('hidden');
        
        // Reposition elements after changing their visibility
        updateTextPositions();
    });
    
    // Arrêter et nettoyer le lecteur YouTube si nécessaire
    if (youtubePlayer && typeof youtubePlayer.stopVideo === 'function') {
        youtubePlayer.stopVideo();
        
        // Si possible, détruire le lecteur YouTube pour éviter les problèmes
        if (typeof youtubePlayer.destroy === 'function') {
            youtubePlayer.destroy();
            youtubePlayer = null;
        }
    }
    
    // Réinitialiser les flags de chargement vidéo
    isLoadingVideo = false;
}

// Fonction pour masquer la vidéo et réinitialiser le jeu
function hideVideoAndReset() {
    // Annuler tout chargement de vidéo en cours
    videoLoadingCancelled = true;
    
    // Réinitialiser l'interface
    resetUI();
    
    // Afficher le texte de redémarrage
    domElements.restartText.classList.add('visible');
    
    // Attendre un peu avant de réinitialiser complètement
    setTimeout(() => {
        initializeGame();
    }, 2000);
}

// Animation sequence manager
class AnimationSequence {
    constructor() {
        this.delay = ms => new Promise(resolve => setTimeout(resolve, ms));
    }

    async centerCard(card) {
        // Calculer le ratio d'échelle
        const scaleRatio = getUniformScaleRatio();
        
        // Sauvegarder la taille actuelle pour réinitialisation ultérieure
        const currentWidth = card.style.width;
        const currentHeight = card.style.height;
        card.dataset.originalWidth = currentWidth;
        card.dataset.originalHeight = currentHeight;
        
        // Calculer la taille de la carte sélectionnée
        const baseWidth = 210; // Mise à jour avec la nouvelle largeur (+20%)
        const baseHeight = 336; // Mise à jour avec la nouvelle hauteur (+20%)
        const selectedScale = 1.2;
        const selectedWidth = `${baseWidth * scaleRatio * selectedScale}px`;
        const selectedHeight = `${baseHeight * scaleRatio * selectedScale}px`;
        
        // Supprimer le style de transformation inline pour laisser la classe CSS prendre effet
        card.style.transform = '';
        
        // Appliquer la taille mise à l'échelle pour la carte sélectionnée
        card.style.width = selectedWidth;
        card.style.height = selectedHeight;
        
        // Mettre à jour la taille du texte dans la carte
        const cardText = card.querySelector('.card-back span');
        if (cardText) {
            cardText.style.fontSize = `${20 * scaleRatio}px`;
        }
        
        // Ajouter la classe selected
        card.classList.add('selected');
        await this.delay(400); // Attendre l'animation de centrage
    }

    async fadeOutOtherCards(card) {
        document.querySelectorAll('.card').forEach(otherCard => {
            if (otherCard !== card) {
                // Clear inline transform style before adding fade-out class
                otherCard.style.transform = '';
                otherCard.classList.add('fade-out');
            }
        });
        document.querySelector('.bottom-text').classList.add('hidden');
        await this.delay(400); // Wait for fade out
    }

    async updateCardContent(card, randomProduction) {
        // Calculer le ratio d'échelle
        const scaleRatio = getUniformScaleRatio();
        
        const cardBack = card.querySelector('.card-back');
        const cardBackSpan = cardBack.querySelector('span');
        
        // Formater le texte du style pour les catégories spéciales
        let styleText = randomProduction.style;
        
        // Cas 1: Styles avec "type beat" - ajouter un saut de ligne
        if (styleText.toLowerCase().includes("type beat")) {
            styleText = styleText.replace(/\s*(type beat)/i, "<br>$1");
        }
        // Cas 2: Styles avec "x" entre deux styles - mettre sur 3 lignes
        else if (styleText.includes(" x ")) {
            const parts = styleText.split(" x ");
            styleText = `${parts[0]}<br><small>x</small><br>${parts[1]}`;
        }
        
        // Utiliser innerHTML au lieu de textContent pour interpréter les balises HTML
        cardBackSpan.innerHTML = styleText;
        
        // Mettre à jour la taille du texte de la carte - augmenté de 50% (20px → 30px)
        cardBackSpan.style.fontSize = `${30 * scaleRatio}px`;
        
        // Appliquer le style spécial pour les cartes rouges
        if (randomProduction.isRed) {
            cardBack.classList.add('metal-hard');
        } else {
            cardBack.classList.remove('metal-hard');
        }
        
        // Masquer le titre principal
        const title = document.querySelector('h1');
        title.classList.add('hidden');
        
        // Préparer le contenu des textes mais ne pas les afficher encore
        const prodTitle = document.querySelector('.prod-title');
        const bpmText = document.querySelector('.bpm-text');
        
        console.log("Préparation des textes:", randomProduction.title);
        
        // Mettre à jour le contenu avec le BPM correct
        prodTitle.textContent = randomProduction.title;
        bpmText.textContent = `${randomProduction.bpm} BPM`;
        
        // Mettre à jour les tailles de police pour ces éléments
        prodTitle.style.fontSize = `${85 * scaleRatio}px`;
        bpmText.style.fontSize = `${36 * scaleRatio}px`;
        
        // S'assurer que les classes hidden sont appliquées
        prodTitle.classList.remove('visible');
        prodTitle.classList.add('hidden');
        
        bpmText.classList.remove('visible');
        bpmText.classList.add('hidden');
        
        await this.delay(300);
    }

    async revealCard(card) {
        console.log("Révélation de la carte...");
        
        // Get the card inner element that will be rotated
        const cardInner = card.querySelector('.card-inner');
        
        // Apply custom rotation based on card size
        // Ensure the rotation works properly with dynamically sized cards
        cardInner.style.transformOrigin = 'center center';
        
        // Forcer un reflow avant d'ajouter la classe revealed
        void card.offsetWidth;
        
        // Ajouter la classe revealed pour déclencher la rotation
        card.classList.add('revealed');
        
        // Vérifier que la transformation est bien appliquée
        console.log("Style de transformation:", getComputedStyle(cardInner).transform);
        
        await this.delay(600); // Wait for rotation
    }

    async descendCard(card) {
         // Stocker les dimensions actuelles pour maintenir la taille
        const currentWidth = card.style.width;
        const currentHeight = card.style.height;
        
        // Appliquer la transformation de descente en utilisant la variable CSS
        // La distance précise est maintenant définie dans la variable CSS --card-descend-distance
        card.style.transform = 'rotate(0)';
        
        // Assurer que la largeur et la hauteur sont préservées pendant la transformation
        card.style.width = currentWidth;
        card.style.height = currentHeight;
        
        // La classe descend va maintenant utiliser la variable CSS pour la distance
        card.classList.add('descend');
        await this.delay(400); // Attendre la descente
    }

    async showVideoAndControls() {
        // Regrouper les mises à jour DOM pour éviter les reflows multiples
        batchDOMUpdates(() => {
            domElements.videoContainer.classList.add('visible');
            
            // Update the transform property for the visible state (position ajustée à 425px)
            domElements.videoContainer.style.transform = 'translate(-50%, -45%) scale(1)';
            
            // Afficher le titre de la production et le BPM en même temps que la vidéo
            domElements.prodTitle.classList.remove('hidden');
            domElements.prodTitle.classList.add('visible');
            
            domElements.bpmText.classList.remove('hidden');
            domElements.bpmText.classList.add('visible');
            
            domElements.restartText.classList.add('visible');
            
            // Mettre à jour l'apparence des boutons en fonction de la disponibilité du lien d'achat
            if (currentProduction && currentProduction.buy) {
                domElements.buyButton.style.opacity = '1';
                domElements.downloadButton.style.opacity = '1';
                domElements.buyButton.style.cursor = 'pointer';
                domElements.downloadButton.style.cursor = 'pointer';
            } else {
                domElements.buyButton.style.opacity = '0.5';
                domElements.downloadButton.style.opacity = '0.5';
                domElements.buyButton.style.cursor = 'not-allowed';
                domElements.downloadButton.style.cursor = 'not-allowed';
            }
            
            // Make sure selected card maintains its size
            updateSelectedCard();
            
            // Reposition elements after changing their visibility
            updateTextPositions();
        });
        
        // Laisser le temps aux animations de se produire
        console.log("Classes du titre de prod:", domElements.prodTitle.className);
        console.log("Classes du texte BPM:", domElements.bpmText.className);
    }
}

// Initialize animation sequence manager
const animationSequence = new AnimationSequence();

// Fonction pour gérer la réinitialisation rapide d'une carte révélée
async function resetCardWithAnimation(card) {
    const cardInner = card.querySelector('.card-inner');
    
    // Ajouter la classe de transition rapide
    cardInner.classList.add('quick-reset');
    
    // Forcer un reflow avant de retirer la classe revealed
    void cardInner.offsetWidth;
    
    // Retirer la classe revealed pour déclencher l'animation de retournement rapide
    card.classList.remove('revealed');
    
    // Attendre un court délai pour laisser le temps à la carte de se retourner
    await animationSequence.delay(150);
    
    // Maintenant retirer les autres classes de position
    card.classList.remove('selected', 'descend');
    
    // Restore original card size if saved
    if (card.dataset.originalWidth && card.dataset.originalHeight) {
        card.style.width = card.dataset.originalWidth;
        card.style.height = card.dataset.originalHeight;
    }
    
    // Forcer un autre reflow pour appliquer les changements de position
    void card.offsetWidth;
    
    // Retirer la classe fade-out pour permettre à la carte de revenir dans le paquet
    card.classList.remove('fade-out');
    
    // Clear the card's transform to let our dynamic positioning take effect
    card.style.transform = '';
    
    // Nettoyer la classe quick-reset après la fin de toutes les animations
    setTimeout(() => {
        cardInner.classList.remove('quick-reset');
    }, 250);
    
    return Promise.resolve();
}

// Initialisation du jeu
async function initializeGame() {
    console.log("Initialisation du jeu...");
    
    // Empêcher les clics pendant la réinitialisation
    isAnimating = true;
    
    // Réinitialiser l'interface
    resetUI();
    
    // Identifier la carte sélectionnée (s'il y en a une)
    const revealedCard = Array.from(domElements.cards).find(card => 
        card.classList.contains('revealed') && card.classList.contains('selected')
    );
    
    // Si une carte est révélée, on l'anime rapidement en premier
    if (revealedCard) {
        await resetCardWithAnimation(revealedCard);
    }
    
    // Réinitialiser toutes les cartes
    domElements.cards.forEach(card => {
        const cardInner = card.querySelector('.card-inner');
        const cardId = card.getAttribute('data-index');
        
        // Annuler les timers de survol existants
        if (hoverTimers[cardId]) {
            clearTimeout(hoverTimers[cardId]);
            delete hoverTimers[cardId];
        }
        
        // Supprimer la classe vibrating si ce n'est pas déjà fait
        cardInner.classList.remove('vibrating');
        
        // S'assurer que toutes les classes sont retirées
        // (redondant pour la carte révélée mais nécessaire pour les autres)
        if (!card.isEqualNode(revealedCard)) {
            card.classList.remove('selected', 'descend', 'revealed', 'fade-out');
        }
        
        // Supprimer les gestionnaires d'événements de réinitialisation
        card.removeEventListener('click', handleRevealedCardClick);
        
        // Réactiver l'attribut onclick original
        if (!card.hasAttribute('onclick')) {
            card.setAttribute('onclick', 'revealCard(this)');
        }
        
        // Clear any inline transform styles
        card.style.transform = '';
    });
    
    // Réinitialiser le titre principal et les textes
    domElements.title.textContent = 'DROP THE MIC';
    domElements.title.classList.remove('hidden');
    
    domElements.bottomText.textContent = 'CHOISIS UNE CARTE';
    domElements.bottomText.classList.remove('hidden');
    
    domElements.restartText.classList.remove('visible');
    
    // Réinitialiser la production actuelle
    currentProduction = null;
    
    // Update card positions based on current window size
    updateCardsFan();
    
    // Attendre que toutes les transitions soient terminées
    await animationSequence.delay(350); // Réduit car les animations sont plus rapides maintenant
    
    // Réinitialiser les variables d'état
    selectedCard = null;
    isAnimating = false;
    
    console.log("Jeu réinitialisé et prêt !");
}

// Fonction pour initialiser le tableau pondéré
function initWeightedCategories() {
    // Créer un tableau avec toutes les catégories disponibles
    weightedCategories = [];
    
    // Ajouter les catégories rouges (poids plus faible)
    for (const categoryName in redCategories) {
        const productions = redCategories[categoryName];
        if (productions && productions.length > 0) {
            // Poids plus faible (1.9) pour les catégories rouges
            for (let i = 0; i < 1.9; i++) {
                weightedCategories.push({
                    category: categoryName,
                    isRed: true,
                    productions: productions
                });
            }
        }
    }
    
    // Ajouter les catégories noires (poids normal)
    for (const categoryName in blackCategories) {
        const productions = blackCategories[categoryName];
        if (productions && productions.length > 0) {
            // Poids normal (3) pour les catégories noires
            for (let i = 0; i < 3; i++) {
                weightedCategories.push({
                    category: categoryName,
                    isRed: false,
                    productions: productions
                });
            }
        }
    }
    
    console.log("Tableau pondéré initialisé avec", weightedCategories.length, "entrées");
}

// Fonction pour obtenir une production aléatoire
function getRandomProduction() {
    // Incrémenter le compteur de cartes depuis la dernière rouge
    cardsSinceLastRed++;
    
    // Distribution progressive pour les cartes rouges:
    // - Faible chance dès la 1ère carte
    // - Probabilité qui augmente progressivement
    // - Moyenne attendue autour de 3.5 cartes
    let shouldSelectRed = false;
    
    // Calculer la probabilité selon une courbe qui donne ~3.5 cartes en moyenne
    // Faible au début, monte progressivement
    let redProbability = 0;
    
    if (cardsSinceLastRed === 1) {
        redProbability = 0.05; // 5% de chance au premier tirage
    } else if (cardsSinceLastRed === 2) {
        redProbability = 0.15; // 15% de chance au deuxième tirage
    } else if (cardsSinceLastRed === 3) {
        redProbability = 0.35; // 35% de chance au troisième tirage
    } else if (cardsSinceLastRed === 4) {
        redProbability = 0.4; // 65% de chance au quatrième tirage
    } else {
        redProbability = 0.4; // 85% de chance ensuite, augmente la probabilité d'obtenir une carte rouge
    }
    
    shouldSelectRed = Math.random() < redProbability;
    
    let selectedProduction;
    
    if (shouldSelectRed) {
        // Sélectionner une carte rouge qui n'a pas encore été utilisée
        const availableRedCategories = {};
        let totalAvailableRedProductions = 0;
        
        // Trouver toutes les productions rouges disponibles (non utilisées)
        for (const categoryName in redCategories) {
            const productions = redCategories[categoryName];
            if (productions && productions.length > 0) {
                const availableProductions = productions.filter(prod => 
                    !usedRedProductions.some(used => used.id === prod.id)
                );
                
                if (availableProductions.length > 0) {
                    availableRedCategories[categoryName] = availableProductions;
                    totalAvailableRedProductions += availableProductions.length;
                }
            }
        }
        
        // Si toutes les cartes rouges ont déjà été utilisées, on réinitialise
        if (totalAvailableRedProductions === 0) {
            console.log("Toutes les cartes rouges ont été utilisées, réinitialisation");
            usedRedProductions = [];
            return getRandomProduction(); // Rappel pour refaire le tirage
        }
        
        // Choisir une catégorie au hasard parmi les disponibles
        const redCategoryNames = Object.keys(availableRedCategories);
        const randomCategoryIndex = Math.floor(Math.random() * redCategoryNames.length);
        const selectedCategory = redCategoryNames[randomCategoryIndex];
        
        // Choisir une production au hasard dans cette catégorie
        const availableProductions = availableRedCategories[selectedCategory];
        const randomIndex = Math.floor(Math.random() * availableProductions.length);
        selectedProduction = availableProductions[randomIndex];
        
        // Ajouter cette production à la liste des productions rouges utilisées
        usedRedProductions.push(selectedProduction);
        
        // Réinitialiser le compteur
        cardsSinceLastRed = 0;
        
        // Retourner la production avec son style et la couleur de la carte
        return {
            ...selectedProduction,
            style: selectedCategory,
            isRed: true
        };
    } else {
        // Sélectionner une carte noire en évitant de répéter la dernière
        // et en pondérant selon le nombre de productions dans chaque catégorie
        
        // Créer un tableau pondéré des catégories noires
        const weightedBlackCategories = [];
        let totalProductions = 0;
        
        // Compter le nombre total de productions noires disponibles
        for (const categoryName in blackCategories) {
            const productions = blackCategories[categoryName];
            if (productions && productions.length > 0) {
                // Éviter de répéter la même production
                const availableProductions = lastBlackProduction 
                    ? productions.filter(prod => prod.id !== lastBlackProduction.id)
                    : productions;
                
                if (availableProductions.length > 0) {
                    totalProductions += availableProductions.length;
                    
                    weightedBlackCategories.push({
                        name: categoryName,
                        productions: availableProductions,
                        count: availableProductions.length
                    });
                }
            }
        }
        
        // S'il n'y a pas de catégories disponibles (très improbable), utiliser toutes les catégories
        if (weightedBlackCategories.length === 0) {
            console.log("Pas de productions noires disponibles, utilisation de toutes les catégories");
            for (const categoryName in blackCategories) {
                const productions = blackCategories[categoryName];
                if (productions && productions.length > 0) {
                    weightedBlackCategories.push({
                        name: categoryName,
                        productions: productions,
                        count: productions.length
                    });
                    totalProductions += productions.length;
                }
            }
        }
        
        // Sélectionner une catégorie avec une probabilité proportionnelle au nombre de productions
        // Si la dernière catégorie était "Trap", limiter ses chances à 7%
        let isTrapRepeat = lastBlackCategory === "Trap";
        let trapThreshold = 0.07; // 7% de chances de répéter Trap
        
        // Appliquer une sélection biaisée si nécessaire
        let selectedCategory = null;
        
        if (isTrapRepeat && Math.random() > trapThreshold) {
            // 93% du temps, on exclut trap et on sélectionne une autre catégorie
            const nonTrapCategories = weightedBlackCategories.filter(cat => cat.name !== "Trap");
            
            if (nonTrapCategories.length > 0) {
                // Recalculer le total des productions sans Trap
                let nonTrapTotal = 0;
                for (const cat of nonTrapCategories) {
                    nonTrapTotal += cat.count;
                }
                
                // Sélectionner une catégorie aléatoire pondérée parmi les non-Trap
                let randomValue = Math.random() * nonTrapTotal;
                for (const category of nonTrapCategories) {
                    randomValue -= category.count;
                    if (randomValue <= 0) {
                        selectedCategory = category;
                        break;
                    }
                }
                
                // Si par hasard on n'a rien sélectionné, prendre la première non-Trap
                if (!selectedCategory && nonTrapCategories.length > 0) {
                    selectedCategory = nonTrapCategories[0];
                }
            } else {
                // Si par un hasard extrême il ne reste que Trap, on le sélectionne quand même
                selectedCategory = weightedBlackCategories.find(cat => cat.name === "Trap");
            }
        } else {
            // Sélection normale pondérée (y compris si on décide de répéter Trap dans 7% des cas)
            let randomValue = Math.random() * totalProductions;
            for (const category of weightedBlackCategories) {
                randomValue -= category.count;
                if (randomValue <= 0) {
                    selectedCategory = category;
                    break;
                }
            }
            
            // Si par hasard on n'a rien sélectionné (ne devrait pas arriver), prendre la première
            if (!selectedCategory && weightedBlackCategories.length > 0) {
                selectedCategory = weightedBlackCategories[0];
            }
        }
    
    // Choisir une production au hasard dans cette catégorie
    const randomIndex = Math.floor(Math.random() * selectedCategory.productions.length);
        selectedProduction = selectedCategory.productions[randomIndex];
        
        // Mettre à jour la dernière production noire sélectionnée
        lastBlackProduction = selectedProduction;
        
        // Mettre à jour la dernière catégorie noire sélectionnée
        lastBlackCategory = selectedCategory.name;
    
    // Retourner la production avec son style et la couleur de la carte
    return {
            ...selectedProduction,
            style: selectedCategory.name,
            isRed: false
        };
    }
}

// Fonction pour charger la vidéo YouTube
async function loadYouTubeVideo(videoId) {
    // Indiquer qu'une vidéo est en cours de chargement
    isLoadingVideo = true;
    videoLoadingCancelled = false;
    
    try {
        // Vérifier d'abord si l'annulation est déjà demandée
        if (videoLoadingCancelled) {
            console.log("Chargement de la vidéo annulé avant de commencer");
            isLoadingVideo = false;
            return;
        }
        
        // S'assurer que l'API YouTube est chargée avant de créer le lecteur
        if (!youtubeAPILoaded) {
            // Vérifier l'annulation avant de charger l'API
            if (videoLoadingCancelled) {
                console.log("Chargement de la vidéo annulé avant le chargement de l'API");
                isLoadingVideo = false;
                return;
            }
            
            try {
            await loadYouTubeAPI();
            } catch (error) {
                console.error("Erreur lors du chargement de l'API YouTube:", error);
                isLoadingVideo = false;
                return;
            }
            
            // Vérifier à nouveau si le chargement a été annulé pendant l'attente de l'API
            if (videoLoadingCancelled) {
                console.log("Chargement de la vidéo annulé pendant le chargement de l'API");
                isLoadingVideo = false;
                return;
            }
        }
        
        // Vérifier à nouveau si le chargement a été annulé
        if (videoLoadingCancelled) {
            console.log("Chargement de la vidéo annulé après chargement de l'API");
            isLoadingVideo = false;
            return;
        }
        
        // Si un lecteur existe déjà, le détruire proprement
        if (youtubePlayer) {
            try {
                youtubePlayer.stopVideo();
            youtubePlayer.destroy();
                youtubePlayer = null;
            } catch (error) {
                console.error("Erreur lors de la destruction du lecteur YouTube existant:", error);
            }
        }
        
        // Nettoyer le contenu de l'iframe si nécessaire
        const youtubeContainer = document.getElementById('youtube-player');
        if (youtubeContainer) {
            youtubeContainer.innerHTML = '';
        }
        
        // Vérifier à nouveau si le chargement a été annulé
        if (videoLoadingCancelled) {
            console.log("Chargement de la vidéo annulé avant création du lecteur");
            isLoadingVideo = false;
            return;
        }
        
        // Adapter le style du conteneur vidéo pour Instagram
        const isInsta = isInstagramBrowser();
        if (isInsta) {
            applyInstagramVideoStyles();
        }
        
        // Créer un nouveau lecteur YouTube avec des contrôles adaptés au contexte
        youtubePlayer = new YT.Player('youtube-player', {
            videoId: videoId,
            playerVars: {
                'autoplay': 1, // Activer l'autoplay pour tous les navigateurs qui le supportent
                'controls': isInsta ? 1 : 0, // Activer les contrôles natifs uniquement pour Instagram
                'showinfo': 0,
                'modestbranding': 1,
                'rel': 0,
                'iv_load_policy': 3,
                'fs': 0,
                'disablekb': 1, // Désactiver les contrôles clavier
                'cc_load_policy': 0,
                'color': 'white',
                'playsinline': 1, // Important pour iOS
                'mute': 1, // Mettre en sourdine pour permettre l'autoplay sur plus de navigateurs
                'origin': window.location.origin,
                'enablejsapi': 1
            },
            events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange,
                'onError': onPlayerError
            }
        });
    } catch (error) {
        console.error("Erreur lors du chargement de la vidéo:", error);
        isLoadingVideo = false;
    }
}

// Fonction pour appliquer des styles spécifiques pour le navigateur Instagram
function applyInstagramVideoStyles() {
    // Créer une feuille de style si elle n'existe pas déjà
    let styleSheet = document.getElementById('instagram-video-styles');
    if (!styleSheet) {
        styleSheet = document.createElement('style');
        styleSheet.id = 'instagram-video-styles';
        document.head.appendChild(styleSheet);
    }
    
    // Configurer les règles CSS spécifiques à Instagram
    const cssRules = `
        /* Styles pour s'assurer que l'iframe YouTube est au premier plan et cliquable */
        #youtube-player,
        #youtube-player iframe {
            position: relative !important;
            z-index: 1000 !important;
            pointer-events: auto !important;
            width: 100% !important;
            height: 100% !important;
        }
        
        /* Désactiver les événements de pointeur sur l'overlay personnalisé */
        .youtube-custom-overlay {
            display: none !important;
            pointer-events: none !important;
        }
        
        /* S'assurer que le conteneur vidéo est transparent aux événements de pointeur */
        .video-container {
            pointer-events: none !important;
            background-color: transparent !important;
        }
        
        /* Mais permettre les interactions directes avec l'iframe à l'intérieur */
        .video-container iframe,
        .video-container #youtube-player {
            pointer-events: auto !important;
        }
        
        /* S'assurer que rien ne recouvre la vidéo */
        .center-play-indicator,
        .custom-video-controls,
        .progress-container {
            display: none !important;
        }
    `;
    
    // Remplacer le contenu de la feuille de style
    styleSheet.textContent = cssRules;
    
    console.log("Styles appliqués pour le navigateur Instagram");
}

// Fonction pour créer l'overlay personnalisé pour le lecteur YouTube
function createCustomYouTubeOverlay() {
    // Récupérer le conteneur vidéo
    const videoContainer = document.querySelector('.video-container');
    if (!videoContainer) return;
    
    // Ne pas créer d'overlay dans le navigateur Instagram
    if (isInstagramBrowser()) {
        console.log("Navigateur Instagram détecté, pas d'overlay personnalisé");
        return;
    }
    
    // Supprimer tout overlay existant
    const existingOverlay = videoContainer.querySelector('.youtube-custom-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }
    
    // Créer l'overlay principal
    const overlay = document.createElement('div');
    overlay.className = 'youtube-custom-overlay';
    
    // Ajouter l'indicateur central pour play/pause
    const centerIndicator = document.createElement('div');
    centerIndicator.className = 'center-play-indicator';
    centerIndicator.innerHTML = '<i>▶</i>'; // Icône Play simplifiée
    overlay.appendChild(centerIndicator);
    
    // Créer le conteneur pour la barre de progression uniquement
    const controls = document.createElement('div');
    controls.className = 'custom-video-controls';
    controls.style.opacity = '1'; // Rendre les contrôles toujours visibles
    
    // Conteneur de la barre de progression
    const progressContainer = document.createElement('div');
    progressContainer.className = 'progress-container';
    
    // Track visible de la barre de progression
    const progressTrack = document.createElement('div');
    progressTrack.className = 'progress-track';
    progressTrack.style.opacity = '0.9'; // Opacité à 80% par défaut
    
    // Barre de progression
    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    
    // Assembler les éléments de progression
    progressTrack.appendChild(progressBar);
    progressContainer.appendChild(progressTrack);
    
    // Ajouter la barre de progression au conteneur de contrôles
    controls.appendChild(progressContainer);
    overlay.appendChild(controls);
    
    // Ajouter l'écouteur d'événement pour le survol
    overlay.addEventListener('mouseenter', function() {
        progressTrack.style.opacity = '1'; // 100% d'opacité au survol
    });
    
    overlay.addEventListener('mouseleave', function() {
        progressTrack.style.opacity = '0.9'; // 80% d'opacité sans survol
    });
    
    // Ajouter l'overlay au conteneur vidéo
    videoContainer.appendChild(overlay);
    
    // Ajouter les écouteurs d'événements
    setupCustomVideoControls(overlay, centerIndicator, progressBar, progressContainer);
}

// Fonction pour configurer les contrôles vidéo personnalisés
function setupCustomVideoControls(overlay, centerIndicator, progressBar, progressContainer) {
    let isPlaying = false;
    let timeoutId = null;
    
    // Fonction pour afficher momentanément l'indicateur central
    function showCenterIndicator(iconType) {
        centerIndicator.innerHTML = `<b>${iconType}</b>`;
        centerIndicator.classList.add('visible');
        
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            centerIndicator.classList.remove('visible');
        }, 800);
    }
    
    // Fonction pour basculer entre lecture et pause
    function togglePlayPause() {
        if (!youtubePlayer) return;
        
        try {
            // Lire ou mettre en pause la vidéo selon l'état actuel
            if (isPlaying) {
                youtubePlayer.pauseVideo();
                overlay.classList.remove('playing');
                showCenterIndicator('▶'); // Afficher l'icône play
            } else {
                youtubePlayer.playVideo();
                overlay.classList.add('playing');
                showCenterIndicator('❚❚'); // Afficher l'icône pause
            }
            
            // Inverser l'état de lecture
            isPlaying = !isPlaying;
            
        } catch (e) {
            console.error("Erreur lors du basculement lecture/pause:", e);
        }
    }
    
    // Écouter les clics sur l'overlay principal pour play/pause
    overlay.addEventListener('click', function(e) {
        // Ignorer si le clic est sur les contrôles
        if (e.target.closest('.custom-video-controls')) return;
        
        togglePlayPause();
    });
    
    // Gérer le clic sur la barre de progression
    progressContainer.addEventListener('click', function(e) {
        // Empêcher la propagation du clic à l'overlay principal
        e.stopPropagation();
        
        if (!youtubePlayer) return;

        const rect = progressContainer.getBoundingClientRect();
        const clickPosition = (e.clientX - rect.left) / rect.width;
        const seekTime = clickPosition * youtubePlayer.getDuration();
        
        youtubePlayer.seekTo(seekTime, true);
        
        // Mettre à jour la barre de progression immédiatement
        const percentage = (seekTime / youtubePlayer.getDuration()) * 100;
        progressBar.style.width = `${percentage}%`;
    });
    
    // Mettre à jour la barre de progression régulièrement
    function updateProgressBar() {
        if (!youtubePlayer || !isPlaying) return;
        
        const currentTime = youtubePlayer.getCurrentTime() || 0;
        const duration = youtubePlayer.getDuration() || 1;
        const percentage = (currentTime / duration) * 100;
        
        if (progressBar) {
            progressBar.style.width = `${percentage}%`;
        }
        
        // Mettre à jour toutes les 250ms
        setTimeout(updateProgressBar, 250);
    }
    
    // Démarrer la mise à jour de la barre de progression
    setTimeout(updateProgressBar, 1000);
    
    // Écouter les événements de l'API YouTube
    document.addEventListener('YT.PlayerState.PLAYING', function() {
        isPlaying = true;
        overlay.classList.add('playing');
    });
    
    document.addEventListener('YT.PlayerState.PAUSED', function() {
        isPlaying = false;
        overlay.classList.remove('playing');
    });
    
    document.addEventListener('YT.PlayerState.ENDED', function() {
        isPlaying = false;
        overlay.classList.remove('playing');
    });
}

// Fonction appelée lorsque le lecteur est prêt
function onPlayerReady(event) {
    // Vérifier si le chargement a été annulé pendant la création du lecteur
    if (videoLoadingCancelled) {
        console.log("Lecture annulée, le jeu a été réinitialisé");
        if (youtubePlayer) {
            youtubePlayer.stopVideo();
            
            // Essayer de détruire le lecteur YouTube proprement
            try {
            youtubePlayer.destroy();
            } catch (error) {
                console.error("Erreur lors de la destruction du lecteur YouTube:", error);
            }
            
            youtubePlayer = null;
            
            // Nettoyer aussi l'iframe
            const youtubeContainer = document.getElementById('youtube-player');
            if (youtubeContainer) {
                youtubeContainer.innerHTML = '';
            }
        }
        isLoadingVideo = false;
        return;
    }
    
    // La vidéo est maintenant prête
    isLoadingVideo = false;
    
    const inInstagramBrowser = isInstagramBrowser();
    
    // Gérer différemment selon le navigateur
    if (!inInstagramBrowser) {
        // Créer l'overlay personnalisé pour contrôler la vidéo sur les navigateurs standards
        createCustomYouTubeOverlay();
        
        // Lancer la lecture automatiquement
        event.target.playVideo();
    } else {
        console.log("Navigateur Instagram détecté, utilisation des contrôles natifs YouTube");
        
        // Pour Instagram, essayer de démarrer la lecture mais avec un délai
        // (certaines versions d'Instagram/iOS nécessitent un délai après le chargement)
        setTimeout(() => {
            try {
                // Essayer de démarrer la vidéo 
                event.target.playVideo();
                
                // Si l'autoplay ne fonctionne pas, attendre l'interaction utilisateur
                console.log("Autoplay tenté sur Instagram, l'utilisateur devra peut-être cliquer manuellement");
            } catch (e) {
                console.error("Erreur lors du démarrage de la vidéo sur Instagram:", e);
            }
        }, 1000);
    }
    
    // Émettre un événement personnalisé
    document.dispatchEvent(new Event('YT.PlayerState.PLAYING'));
}

// Fonction appelée lorsque l'état du lecteur change
function onPlayerStateChange(event) {
    // Si le chargement a été annulé, arrêter immédiatement la vidéo
    if (videoLoadingCancelled) {
        youtubePlayer.stopVideo();
        youtubePlayer.destroy();
        youtubePlayer = null;
        return;
    }
    
    // Émettre des événements personnalisés pour les différents états
    switch(event.data) {
        case YT.PlayerState.PLAYING:
            document.dispatchEvent(new Event('YT.PlayerState.PLAYING'));
            break;
        case YT.PlayerState.PAUSED:
            document.dispatchEvent(new Event('YT.PlayerState.PAUSED'));
            break;
        case YT.PlayerState.ENDED:
            document.dispatchEvent(new Event('YT.PlayerState.ENDED'));
            console.log("Vidéo terminée");
            // Faire disparaître la vidéo et réinitialiser le jeu
            hideVideoAndReset();
            break;
    }
}

// Fonction pour effectuer des mises à jour DOM groupées
function batchDOMUpdates(updateFunction) {
    requestAnimationFrame(() => {
        updateFunction();
    });
}

// Fonction pour révéler une carte
async function revealCard(card) {
    // Prevent multiple clicks or clicks during animation
    if (selectedCard || card.classList.contains('revealed') || isAnimating || isLoadingVideo) {
        return;
    }

    try {
        // Verrouiller les interactions pendant l'animation
        isAnimating = true;
        selectedCard = card;
        
        // Annuler tout chargement de vidéo précédent (au cas où)
        videoLoadingCancelled = true;
        
        // Annuler les effets de survol en cours
        const cardInner = card.querySelector('.card-inner');
        const cardId = card.getAttribute('data-index');
        
        if (hoverTimers[cardId]) {
            clearTimeout(hoverTimers[cardId]);
            delete hoverTimers[cardId];
        }
        
        cardInner.classList.remove('vibrating');
        
        // Sauvegarde de la transformation actuelle pour la réinitialisation
        card.dataset.originalTransform = card.style.transform;
        
        const randomProduction = getRandomProduction();
        // Stocker la production actuelle pour les boutons d'achat et de téléchargement
        currentProduction = randomProduction;
        
        // Reset des flags de chargement vidéo pour cette nouvelle tentative
        videoLoadingCancelled = false;
        
        // Execute animation sequence
        await animationSequence.centerCard(card);
        await animationSequence.fadeOutOtherCards(card);
        await animationSequence.updateCardContent(card, randomProduction);
        await animationSequence.revealCard(card);
        await animationSequence.descendCard(card);
        await animationSequence.showVideoAndControls();
        
        // Vérifier si l'animation a été annulée entre-temps
        if (videoLoadingCancelled) {
            console.log("Animation annulée avant le chargement de la vidéo");
            isAnimating = false;
            return;
        }
        
        // Load video after all animations
        await loadYouTubeVideo(randomProduction.id);
        
        // Vérifier à nouveau si le chargement a été annulé
        if (videoLoadingCancelled) {
            console.log("Chargement vidéo annulé");
            isAnimating = false;
            return;
        }
        
        // Supprimer l'attribut onclick pour éviter les conflits
        card.removeAttribute('onclick');
        
        // Supprimer les gestionnaires d'événements existants pour éviter les doublons
        card.removeEventListener('click', handleRevealedCardClick);
        
        // Ajouter le gestionnaire d'événements pour réinitialiser
        card.addEventListener('click', handleRevealedCardClick);
        
        // Autoriser les interactions après la fin de l'animation
        isAnimating = false;
    } catch (error) {
        console.error('Animation sequence failed:', error);
        // Reset state in case of error
        videoLoadingCancelled = true;
        isAnimating = false;
        initializeGame();
    }
}

// Gestionnaire d'événements pour le clic sur une carte révélée
async function handleRevealedCardClick(event) {
    // Empêcher la propagation pour éviter de déclencher d'autres événements
    event.stopPropagation();
    
    // Vérifier si l'animation est en cours
    if (isAnimating) {
        console.log("Animation en cours, clic ignoré");
        return;
    }
    
    console.log("Clic sur carte révélée, réinitialisation du jeu...");
    
    // Verrouiller les interactions pendant l'animation
    isAnimating = true;
    
    // IMPORTANT: Annuler immédiatement tout chargement vidéo en cours
    videoLoadingCancelled = true;
    isLoadingVideo = false;
    
    // S'assurer que le lecteur YouTube est complètement détruit
    if (youtubePlayer) {
        try {
            // Arrêter la vidéo immédiatement si le lecteur existe
            if (typeof youtubePlayer.stopVideo === 'function') {
                youtubePlayer.stopVideo();
            }
            
            // Essayer de détruire le lecteur YouTube
            if (typeof youtubePlayer.destroy === 'function') {
                youtubePlayer.destroy();
            }
            
            // Réinitialiser complètement la référence
            youtubePlayer = null;
            
            // Nettoyer aussi le contenu de l'iframe
            const youtubeContainer = document.getElementById('youtube-player');
            if (youtubeContainer) {
                youtubeContainer.innerHTML = '';
            }
        } catch (error) {
            console.error("Erreur lors de la destruction du lecteur YouTube:", error);
        }
    }
    
    // Masquer immédiatement la vidéo (sans transition)
    domElements.videoContainer.classList.add('instant-hide');
    domElements.videoContainer.classList.remove('visible');
    
    // Masquer également les boutons et textes immédiatement
    domElements.buyButton.style.opacity = '0';
    domElements.downloadButton.style.opacity = '0';
    domElements.prodTitle.classList.remove('visible');
    domElements.prodTitle.classList.add('hidden');
    domElements.bpmText.classList.remove('visible');
    domElements.bpmText.classList.add('hidden');
    
    // Faire pivoter la carte rapidement avant de réinitialiser tout le jeu
    const clickedCard = event.currentTarget;
    await resetCardWithAnimation(clickedCard);
    
    // Retirer la classe d'instant-hide pour le prochain affichage
    domElements.videoContainer.classList.remove('instant-hide');
    
    // Ensuite réinitialiser le jeu complet
    initializeGame();
}

// Function to update text element positions based on window size
function updateTextPositions() {
    // Calcul du ratio de mise à l'échelle global (en prenant le plus petit pour préserver l'aspect)
    const scaleRatio = getUniformScaleRatio();
    
    // Dimensions du contenu mis à l'échelle
    const referenceWidth = 1920;
    const referenceHeight = 1080;
    const scaledContentWidth = referenceWidth * scaleRatio;
    const scaledContentHeight = referenceHeight * scaleRatio;
    
    // Calcul des marges pour centrer le contenu
    const marginHorizontal = (window.innerWidth - scaledContentWidth) / 2;
    const marginVertical = (window.innerHeight - scaledContentHeight) / 2;
    
    // Position du titre principal (h1) - en haut
    const titleElement = document.querySelector('h1');
    const titleTopReference = 40; // position en px dans la référence 1080p
    titleElement.style.position = 'fixed';
    titleElement.style.top = `${marginVertical + (titleTopReference * scaleRatio)}px`;
    titleElement.style.left = '0';
    titleElement.style.right = '0';
    
    // Utiliser le style calculé pour obtenir la taille du titre définie dans la variable CSS
    const computedStyle = getComputedStyle(document.documentElement);
    const titleSize = parseInt(computedStyle.getPropertyValue('--main-title-size'));
    titleElement.style.fontSize = `${titleSize * scaleRatio}px`;
    
    // Position du titre de production si visible
    const prodTitleElement = document.querySelector('.prod-title');
    if (prodTitleElement) {
        const prodTitleTopReference = 80;
        prodTitleElement.style.position = 'fixed';
        prodTitleElement.style.top = `${marginVertical + (prodTitleTopReference * scaleRatio)}px`;
        prodTitleElement.style.left = '0';
        prodTitleElement.style.right = '0';
        prodTitleElement.style.fontSize = `${85 * scaleRatio}px`;
    }
    
    // Position du texte BPM si visible
    const bpmTextElement = document.querySelector('.bpm-text');
    if (bpmTextElement) {
        const bpmTextTopReference = 160;
        bpmTextElement.style.position = 'fixed';
        bpmTextElement.style.top = `${marginVertical + (bpmTextTopReference * scaleRatio)}px`;
        bpmTextElement.style.left = '0';
        bpmTextElement.style.right = '0';
        bpmTextElement.style.fontSize = `${36 * scaleRatio}px`;
    }
    
    // Position du texte du bas
    const bottomTextElement = document.querySelector('.bottom-text');
    const bottomTextTopReference = 900; // proche du bas en 1080p
    bottomTextElement.style.position = 'fixed';
    bottomTextElement.style.top = `${marginVertical + (bottomTextTopReference * scaleRatio)}px`;
    bottomTextElement.style.bottom = 'auto';
    bottomTextElement.style.left = '0';
    bottomTextElement.style.right = '0';
    bottomTextElement.style.fontSize = `${32 * scaleRatio}px`;
    
    // Position du texte de redémarrage si visible
    const restartTextElement = document.querySelector('.restart-text');
    if (restartTextElement) {
        const restartTextTopReference = 950;
        restartTextElement.style.position = 'fixed';
        restartTextElement.style.top = `${marginVertical + (restartTextTopReference * scaleRatio)}px`;
        restartTextElement.style.bottom = 'auto';
        restartTextElement.style.left = '0';
        restartTextElement.style.right = '0';
        restartTextElement.style.fontSize = `${20 * scaleRatio}px`;
    }
    
    // Position du conteneur de cartes
    const cardsContainer = document.querySelector('.game-container');
    if (cardsContainer) {
        const cardsContainerTopReference = 500; // centré verticalement en 1080p
        cardsContainer.style.position = 'fixed';
        cardsContainer.style.top = `${marginVertical + (cardsContainerTopReference * scaleRatio)}px`;
        cardsContainer.style.transform = 'translateY(-50%)';
        cardsContainer.style.left = '0';
        cardsContainer.style.right = '0';
        
        // Ajuster les cartes
        updateCardsFan(scaleRatio);
    }
    
    // Position du conteneur vidéo
    const videoContainer = document.querySelector('.video-container');
    if (videoContainer) {
        // Ajuster la position verticale de la vidéo (350 → 425)
        const videoContainerTopReference = 425; // Position intermédiaire entre 500 et 350
        const videoWidth = 656 * scaleRatio;
        const videoHeight = 369 * scaleRatio;
        
        videoContainer.style.position = 'fixed';
        videoContainer.style.top = `${marginVertical + (videoContainerTopReference * scaleRatio)}px`;
        videoContainer.style.left = '50%';
        videoContainer.style.width = `${videoWidth}px`;
        videoContainer.style.height = `${videoHeight}px`;
        
        // Gestion de l'état visible/caché avec un ajustement pour la nouvelle position
        if (!videoContainer.classList.contains('visible')) {
            videoContainer.style.transform = 'translate(-50%, -80%) scale(0.8)';
        } else {
            // Ajuster aussi la transformation pour qu'elle corresponde à la nouvelle position
            videoContainer.style.transform = 'translate(-50%, -45%) scale(1)';
        }
    }
    
    // Position des boutons achat et téléchargement
    const buyButton = document.querySelector('.buy-button');
    const downloadButton = document.querySelector('.download-button');
    
    if (buyButton) {
        const buyButtonTopReference = 450;
        const buttonWidth = 180 * scaleRatio;
        const buttonHeight = 55 * scaleRatio;
        const buttonOffset = 350 * scaleRatio;
        
        buyButton.style.position = 'fixed';
        buyButton.style.top = `${marginVertical + (buyButtonTopReference * scaleRatio)}px`;
        buyButton.style.left = `calc(50% + ${buttonOffset}px)`;
        buyButton.style.transform = 'translateY(-75%)';
        buyButton.style.width = `${buttonWidth}px`;
        buyButton.style.height = `${buttonHeight}px`;
        
        // Taille du texte dans le bouton
        const buyButtonText = buyButton.querySelector('span');
        if (buyButtonText) {
            buyButtonText.style.fontSize = `${14.5 * scaleRatio}px`;
        }
        
        // Taille de l'icône
        const buyButtonIcon = buyButton.querySelector('img');
        if (buyButtonIcon) {
            buyButtonIcon.style.width = `${24 * scaleRatio}px`;
            buyButtonIcon.style.height = `${24 * scaleRatio}px`;
        }
    }
    
    if (downloadButton) {
        const downloadButtonTopReference = 450;
        const buttonWidth = 180 * scaleRatio;
        const buttonHeight = 55 * scaleRatio;
        const buttonOffset = 350 * scaleRatio;
        
        downloadButton.style.position = 'fixed';
        downloadButton.style.top = `${marginVertical + (downloadButtonTopReference * scaleRatio)}px`;
        downloadButton.style.right = `calc(50% + ${buttonOffset}px)`;
        downloadButton.style.transform = 'translateY(-75%)';
        downloadButton.style.width = `${buttonWidth}px`;
        downloadButton.style.height = `${buttonHeight}px`;
        
        // Taille du texte dans le bouton
        const downloadButtonText = downloadButton.querySelector('span');
        if (downloadButtonText) {
            downloadButtonText.style.fontSize = `${14.5 * scaleRatio}px`;
        }
        
        // Taille de l'icône
        const downloadButtonIcon = downloadButton.querySelector('img');
        if (downloadButtonIcon) {
            downloadButtonIcon.style.width = `${24 * scaleRatio}px`;
            downloadButtonIcon.style.height = `${24 * scaleRatio}px`;
        }
    }
    
    // Mettre à jour les cartes décoratives
    updateDecorativeCards();
    
    // Mettre à jour la carte sélectionnée si elle existe
    updateSelectedCard(scaleRatio);
}

// Function to update the positioning of cards in the fan based on window size
function updateCardsFan(scaleRatio) {
    // Get all cards
    const cards = document.querySelectorAll('.card');
    if (!cards.length) return;
    
    // Si scaleRatio n'est pas fourni, le calculer
    if (!scaleRatio) {
        scaleRatio = getUniformScaleRatio();
    }
    
    // Tailles de référence pour les cartes en 1080p
    const baseWidth = 210; // 175px → 210px (+20%)
    const baseHeight = 336; // 280px → 336px (+20%)
    const cardWidth = baseWidth * scaleRatio;
    const cardHeight = baseHeight * scaleRatio;
    
    // Valeurs de référence pour le positionnement
    const baseTranslateX = [180, 105, 35, 35, 105, 180];
    const baseTranslateY = [80, 30, 0, 0, 30, 80];
    const rotations = [-45, -27, -9, 9, 27, 45];
    
    // Appliquer les positions et tailles aux cartes
    cards.forEach((card, index) => {
        // Ignorer les cartes dans des états spéciaux
        if (card.classList.contains('selected') || card.classList.contains('fade-out')) {
            return;
        }
        
        // Redimensionner la carte
        card.style.width = `${cardWidth}px`;
        card.style.height = `${cardHeight}px`;
        
        // Appliquer des positions proportionnelles
        const translateX = baseTranslateX[index] * scaleRatio;
        const translateY = baseTranslateY[index] * scaleRatio;
        const rotation = rotations[index];
        
        // Déterminer si la carte est à gauche ou à droite
        const isLeft = index < 3;
        
        // Appliquer la transformation
        if (isLeft) {
            card.style.transform = `rotate(${rotation}deg) translate(-${translateX}px, -${translateY}px)`;
        } else {
            card.style.transform = `rotate(${rotation}deg) translate(${translateX}px, -${translateY}px)`;
        }
        
        // Taille du texte dans la carte
        const cardText = card.querySelector('.card-back span');
        if (cardText) {
            cardText.style.fontSize = `${16 * scaleRatio}px`;
        }
    });
}

// Function to update the size of a selected/revealed card
function updateSelectedCard(scaleRatio) {
    const selectedCard = document.querySelector('.card.selected');
    if (selectedCard) {
        // Si scaleRatio n'est pas fourni, le calculer
        if (!scaleRatio) {
            scaleRatio = getUniformScaleRatio();
        }
        
        // Tailles de référence pour les cartes en 1080p
        const baseWidth = 210; // 175px → 210px (+20%)
        const baseHeight = 336; // 280px → 336px (+20%)
        const selectedScale = 1.2; // facteur d'agrandissement pour la carte sélectionnée
        const selectedWidth = baseWidth * scaleRatio * selectedScale;
        const selectedHeight = baseHeight * scaleRatio * selectedScale;
        
        // Appliquer la nouvelle taille
        selectedCard.style.width = `${selectedWidth}px`;
        selectedCard.style.height = `${selectedHeight}px`;
        
        // Mettre à jour la taille du texte dans la carte
        const cardText = selectedCard.querySelector('.card-back span');
        if (cardText) {
            // Maintenir la taille à 30px (augmentée de 50%) pour le texte du style musical
            cardText.style.fontSize = `${30 * scaleRatio}px`;
        }
        
        // Si la carte est descendue, mettre à jour sa position
        if (selectedCard.classList.contains('descend')) {
            const descendDistance = selectedHeight * 0.85;
            selectedCard.style.transform = `rotate(0) translateY(${descendDistance}px)`;
        }
        
        // Mettre à jour l'origine de la transformation pour assurer une rotation correcte
        const cardInner = selectedCard.querySelector('.card-inner');
        if (cardInner) {
            cardInner.style.transformOrigin = 'center center';
        }
    }
}

// Fonction pour vérifier si l'appareil est un téléphone mobile
function isMobileDevice() {
    return (
        navigator.userAgent.match(/Android/i) ||
        navigator.userAgent.match(/webOS/i) ||
        navigator.userAgent.match(/iPhone/i) ||
        navigator.userAgent.match(/iPad/i) ||
        navigator.userAgent.match(/iPod/i) ||
        navigator.userAgent.match(/BlackBerry/i) ||
        navigator.userAgent.match(/Windows Phone/i)
    );
}

// Fonction pour détecter si nous sommes dans le navigateur Instagram
function isInstagramBrowser() {
    // Vérifier si l'agent utilisateur contient "Instagram"
    if (navigator.userAgent.includes('Instagram')) {
        return true;
    }
    
    // Vérifier si l'URL de référence provient d'Instagram
    if (document.referrer && document.referrer.includes('instagram.com')) {
        return true;
    }
    
    // Certaines implémentations du WebView d'Instagram modifient window.navigator
    try {
        if (window.navigator.userAgent.indexOf('Instagram') !== -1) {
            return true;
        }
    } catch (e) {
        console.error("Erreur lors de la vérification de userAgent:", e);
    }
    
    // Vérifier si nous sommes dans un iframe (méthode parfois utilisée par Instagram)
    try {
        if (window !== window.top) {
            return true;
        }
    } catch (e) {
        // L'accès à window.top a échoué, ce qui suggère souvent un iframe cross-origin
        return true;
    }
    
    return false;
}

// Initialiser les variables CSS au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    // Mettre à jour les variables CSS globales
    updateGlobalCSSVariables();
    
    // Initialize DOM elements
    initializeDOMElements();
    
    // Set up dynamic text positioning
    updateTextPositions();
    
    // Add resize event listener to update positions when window is resized
    window.addEventListener('resize', handleWindowResize);
    
    // Initialize game
    initializeGame();
    
    // Set up card hover effects
    setupCardHoverEffects();
});

// Function to handle window resize with debounce
let resizeTimeout;
function handleWindowResize() {
    // Clear the timeout if it exists
    if (resizeTimeout) {
        clearTimeout(resizeTimeout);
    }
    
    // Set a timeout to avoid excessive function calls during resize
    resizeTimeout = setTimeout(() => {
        
        // Force recomputation of CSS variables to capture any changes to --main-title-size
        document.documentElement.style.setProperty('--reflow-trigger', Date.now());
        
        // Calculer le ratio d'échelle une seule fois
        const scaleRatio = getUniformScaleRatio();
        
        // Mettre à jour les variables CSS globales
        updateGlobalCSSVariables();
        
        // Update the positions of all elements
        updateTextPositions();
        
        // Mettre à jour les cartes décoratives indépendamment de l'animation
        updateDecorativeCards();
        
        // If we're in the middle of an animation, don't update the cards
        if (!isAnimating) {
            // Forcer le rafraîchissement complet des positions et tailles
            document.querySelectorAll('.card').forEach(card => {
                if (!card.classList.contains('selected')) {
                    card.style.transform = '';
                }
            });
            updateCardsFan(scaleRatio);
            updateSelectedCard(scaleRatio);
        }
    }, 150); // 150ms debounce
}

// Fonction utilitaire pour obtenir le ratio d'échelle uniforme
function getUniformScaleRatio() {
    // Calculer le ratio de mise à l'échelle horizontal et vertical
    const horizontalRatio = window.innerWidth / 1180;
    const verticalRatio = window.innerHeight / 1080;

    return Math.min(horizontalRatio, verticalRatio);
}

// Function to update global CSS variables based on current scale
function updateGlobalCSSVariables() {
    const scaleRatio = getUniformScaleRatio();
    
    // Calculer la distance de descente des cartes
    const baseHeight = 336; // hauteur de référence des cartes
    const selectedScale = 1.2; // facteur d'agrandissement pour les cartes sélectionnées
    const cardHeight = baseHeight * scaleRatio * selectedScale;
    const descendDistance = cardHeight * 0.75; // Réduit de 0.85 à 0.8075 (5% de moins)
    
    // Appliquer la distance de descente comme variable CSS
    document.documentElement.style.setProperty('--card-descend-distance', `${descendDistance}px`);
    
    // Définir les rayons de bordure proportionnels à la résolution
    // Ces valeurs sont basées sur le design à 1080p
    const cardBorderRadius = 15 * scaleRatio;
    const decorativeCardBorderRadius = 10 * scaleRatio;
    const buttonBorderRadius = 10 * scaleRatio;
    const videoBorderRadius = 12 * scaleRatio;
    
    // Définir l'épaisseur de la bordure vidéo proportionnelle à la résolution
    // Basée sur une bordure de 6px en 1080p
    const videoBorderWidth = 6 * scaleRatio;
    
    // Appliquer les rayons de bordure comme variables CSS
    document.documentElement.style.setProperty('--card-border-radius', `${cardBorderRadius}px`);
    document.documentElement.style.setProperty('--decorative-card-border-radius', `${decorativeCardBorderRadius}px`);
    document.documentElement.style.setProperty('--button-border-radius', `${buttonBorderRadius}px`);
    document.documentElement.style.setProperty('--video-border-radius', `${videoBorderRadius}px`);
    document.documentElement.style.setProperty('--video-border-width', `${videoBorderWidth}px`);
}

// Fonction appelée en cas d'erreur du lecteur
function onPlayerError(event) {
    console.error("Erreur de lecture YouTube:", event.data);
    // En cas d'erreur, on peut aussi réinitialiser
    hideVideoAndReset();
}
