# Recommandations pour le système de suivi des cours (Course Progress)

## 📋 Vue d'ensemble

Le système de suivi des cours permet aux professeurs de suivre la progression de chaque matière enseignée dans chaque classe. Chaque combinaison classe-matière crée un `course_progress`, et chaque leçon de la matière peut avoir un `lesson_progress` associé pour cette classe spécifique.

## ✅ Modifications apportées

### 1. Schéma de base de données

#### `course_progress` (complété)
- ✅ Ajout de `user_id` : permet de lier le suivi à un professeur spécifique
- ✅ Ajout de `status` : permet de suivre l'état général du cours (`not_started`, `in_progress`, `completed`, `on_hold`)
- ✅ Ajout de `created_at` et `updated_at` : timestamps système

#### `lesson_progress` (créé)
- ✅ Table créée pour suivre chaque leçon individuellement pour chaque combinaison classe-matière
- ✅ Champs principaux : `lesson_id`, `course_progress_id`, `status`, `scheduled_date`, `completed_at`
- ✅ Système de commentaires : tableau de commentaires pour chaque leçon avec titre et description
- ✅ Timestamps système

### 2. Router backend
- ✅ Le router `course_progress.ts` existe déjà et est complet
- ✅ Toutes les opérations CRUD sont implémentées
- ✅ Router bien intégré dans `backend/src/router/index.ts`

### 3. Hooks API frontend
- ✅ Création de `useCourseProgress.ts` avec tous les hooks nécessaires
- ✅ Création de `useLessonProgress.ts` pour gérer les progressions de leçons

## 🎯 Recommandations d'amélioration

### 1. Base de données

#### A. Champs additionnels pour `course_progress`

```surql
-- Dates de début et fin du cours
DEFINE FIELD start_date ON TABLE course_progress TYPE option<datetime>;
DEFINE FIELD end_date ON TABLE course_progress TYPE option<datetime>;

-- Métadonnées utiles
DEFINE FIELD notes ON TABLE course_progress TYPE option<string>; -- Notes générales sur le cours
DEFINE FIELD total_planned_hours ON TABLE course_progress TYPE option<number>; -- Heures planifiées
DEFINE FIELD total_completed_hours ON TABLE course_progress TYPE option<number>; -- Heures complétées
```

**Justification** : Permet un suivi plus précis des dates et heures effectives vs planifiées.

#### B. Indexation pour les performances

```surql
-- Index pour accélérer les requêtes fréquentes
DEFINE INDEX course_progress_user_class_subject ON TABLE course_progress FIELDS user_id, class_id, subject_id;
DEFINE INDEX lesson_progress_course_progress ON TABLE lesson_progress FIELDS course_progress_id;
DEFINE INDEX lesson_progress_lesson ON TABLE lesson_progress FIELDS lesson_id;
```

**Justification** : Les requêtes de type "trouver course_progress pour user X, classe Y, matière Z" sont fréquentes.

#### C. Validation et contraintes

```surql
-- Contrainte pour éviter les doublons
-- (Déjà gérée par le code, mais pourrait être renforcée au niveau DB)
-- S'assurer qu'il n'y a qu'un seul course_progress actif par user/class/subject
```

### 2. Fonctionnalités UX

#### A. Vue d'ensemble de la page courses

**Problème actuel** : La page courses utilise des données demo et ne reflète pas la réalité.

**Recommandations** :
1. **Transformation des données** : Créer une fonction qui transforme les `course_progress` en format `CourseProgram` pour la page
2. **Calcul automatique de la progression** : 
   - Calculer `completedHours` en sommant les durées des leçons complétées
   - Calculer `totalHours` en sommant les durées de toutes les leçons du sujet
   - Calculer le pourcentage de progression
3. **Prochaines leçons** : Extraire les `lesson_progress` avec status `scheduled` ou `not_started`, triés par `scheduled_date` ou `order`

#### B. Vue détaillée d'un cours

**Fonctionnalités recommandées** :
1. **Liste des leçons avec statut** :
   - Afficher toutes les leçons du sujet
   - Afficher le statut de chaque leçon pour cette classe
   - Permettre de cliquer sur une leçon pour voir/éditer son `lesson_progress`
   
2. **Calendrier de progression** :
   - Vue calendrier avec les leçons planifiées (`scheduled_date`)
   - Vue timeline montrant la progression chronologique
   
3. **Commentaires et notes** :
   - Section dédiée pour ajouter des commentaires sur une leçon
   - Historique des commentaires avec dates
   - Recherche dans les commentaires

4. **Statistiques avancées** :
   - Graphique de progression dans le temps
   - Temps moyen par leçon
   - Comparaison avec les autres classes du même niveau

#### C. Actions rapides

**Recommandations UX** :
1. **Création rapide de course_progress** :
   - Formulaire simple : Sélectionner classe + matière
   - Auto-création si n'existe pas lors du clic sur "Voir le cours"
   
2. **Gestion des leçons** :
   - Bouton "Marquer comme complétée" directement depuis la liste
   - Drag & drop pour réorganiser l'ordre des leçons
   - Planification rapide : clic pour définir `scheduled_date`
   
3. **Ajout de commentaires** :
   - Overlay rapide pour ajouter un commentaire sans quitter la page
   - Éditeur markdown pour les commentaires longs
   - Tags/catégories pour les commentaires (ex: "Problème", "Remarque", "À revoir")

### 3. Améliorations techniques

#### A. Endpoints additionnels recommandés

```typescript
// Statistiques agrégées pour un course_progress
export const getCourseProgressStats = base
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
        // Retourne: total hours, completed hours, average lesson duration, etc.
    });

// Liste des leçons avec leur statut pour un course_progress
export const getLessonsWithProgress = base
    .input(z.object({ course_progress_id: z.string() }))
    .handler(async ({ input, context }) => {
        // Retourne toutes les leçons du sujet avec leur lesson_progress correspondant
    });

// Créer automatiquement lesson_progress pour toutes les leçons d'un cours
export const initializeCourseProgressLessons = base
    .input(z.object({ course_progress_id: z.string() }))
    .handler(async ({ input, context }) => {
        // Crée un lesson_progress en "not_started" pour chaque leçon du sujet
    });
```

#### B. Amélioration des commentaires

**Recommandation** : Ajouter un champ `comment_id` pour permettre :
- Modification d'un commentaire spécifique sans réécrire tout le tableau
- Suppression d'un commentaire
- Réponses/threads de commentaires

```typescript
// Patch input amélioré pour les commentaires
export const lesson_progress_patch_comment_input = z.object({
    lesson_progress_id: z.string(),
    comment_id: z.string().optional(), // Si présent, modifie un commentaire existant
    action: z.enum(["add", "update", "delete"]),
    title: z.string().optional(),
    description: z.string().optional(),
});
```

### 4. Expérience utilisateur (UX)

#### A. Navigation et organisation

**Recommandations** :
1. **Filtres améliorés** :
   - Filtre par statut de progression (`not_started`, `in_progress`, `completed`)
   - Filtre par classe (déjà présent)
   - Filtre par matière (déjà présent)
   - Filtre combiné : classe + matière (déjà présent via getByClassAndSubject)

2. **Vues multiples** :
   - Vue liste (actuelle)
   - Vue tableau avec colonnes : Classe, Matière, Progression, Statut, Actions
   - Vue carte pour une visualisation plus visuelle

3. **Recherche** :
   - Barre de recherche pour trouver rapidement une classe ou matière
   - Recherche dans les commentaires de leçons

#### B. Feedback visuel

**Recommandations** :
1. **Indicateurs de statut** :
   - Couleurs cohérentes pour les statuts (vert = completed, bleu = in_progress, etc.)
   - Badges avec icônes pour les statuts
   - Barres de progression animées

2. **Notifications** :
   - Rappels pour les leçons planifiées (`scheduled_date` approchant)
   - Alertes si une leçon est en retard par rapport à la planification
   - Confirmation visuelle lors des actions (création, mise à jour, suppression)

#### C. Workflow optimisé

**Scénario typique d'utilisation** :

1. **Professeur ouvre la page courses**
   - Voit tous ses cours (class-matière) en cours
   - Peut filtrer par classe ou matière

2. **Professeur clique sur un cours**
   - Voit la progression globale
   - Voit la liste des leçons avec leur statut
   - Peut cliquer sur une leçon pour voir les détails

3. **Professeur planifie une leçon**
   - Clic sur "Planifier" → calendrier → sélection date
   - La leçon passe en statut `scheduled`

4. **Après avoir enseigné la leçon**
   - Clic sur "Marquer comme complétée"
   - Option d'ajouter un commentaire (ex: "Exercices supplémentaires donnés", "Difficultés rencontrées avec chapitre 3")
   - Le `completed_at` est automatiquement défini

5. **Consultation de la progression**
   - Graphique de progression mis à jour automatiquement
   - Statistiques calculées en temps réel

## 📝 Prochaines étapes recommandées

### Priorité 1 (Essentiel)
1. ✅ Mettre à jour le schéma de base de données (fait)
2. ⏳ Mettre à jour la page courses pour utiliser les vraies données API
3. ⏳ Créer la fonction de transformation des données
4. ⏳ Implémenter l'affichage des leçons avec leur statut

### Priorité 2 (Important)
1. Ajouter les champs recommandés à `course_progress` (dates, heures)
2. Créer les endpoints de statistiques
3. Implémenter l'ajout/modification de commentaires depuis l'UI
4. Ajouter les index pour les performances

### Priorité 3 (Amélioration)
1. Vue calendrier pour les leçons planifiées
2. Graphiques de progression
3. Système de notifications/rappels
4. Recherche avancée

## 🔍 Points d'attention

1. **Performance** : Quand il y a beaucoup de leçons et de classes, les requêtes peuvent être lentes. Les index aideront.

2. **Cohérence des données** : S'assurer que les `lesson_progress` sont bien liés aux bonnes leçons et cours.

3. **Permissions** : Vérifier que chaque professeur ne peut accéder qu'à ses propres `course_progress` (déjà géré par `user_id` dans les requêtes).

4. **Synchronisation** : Si une leçon est supprimée du sujet, que faire des `lesson_progress` associés ? (Décision métier nécessaire)

## 📚 Documentation technique

### Structure des données

```
CourseProgress (course_progress)
├── id
├── class_id → Classes
├── subject_id → Subjects
├── user_id → Users
├── status: 'not_started' | 'in_progress' | 'completed' | 'on_hold'
├── created_at
└── updated_at

LessonProgress (lesson_progress)
├── id
├── lesson_id → Lessons
├── course_progress_id → CourseProgress
├── status: 'not_started' | 'scheduled' | 'in_progress' | 'completed' | 'skipped'
├── scheduled_date (optionnel)
├── completed_at (optionnel)
├── comments[] (optionnel)
│   ├── title (optionnel)
│   ├── description
│   ├── created_at
│   └── updated_at
├── created_at
└── updated_at
```

### Flux de données recommandé

1. **Affichage de la liste des cours** :
   ```
   listCourseProgress() → CourseProgress[]
   → Transformer en CourseProgram[] pour l'UI
   ```

2. **Affichage du détail d'un cours** :
   ```
   getCourseProgressWithLessons(id) → CourseProgressWithLessons
   → Afficher progression + liste des leçons avec statuts
   ```

3. **Mise à jour d'une leçon** :
   ```
   patchLessonProgress({ id, status: 'completed', comments: [...] })
   → Invalider les queries de courseProgress
   → Recharger automatiquement la vue
   ```

