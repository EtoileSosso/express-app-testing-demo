## 1. Convention de coding

- Pour les projets Drupal, faire en sorte que le linter airbnb prenne en compte les variables globales Drupal & JQuery
- Mettre toutes les variables en anglais, sauf exception
- En php les variables doivent toutes être en snake case
- Single quote pour toutes les variables php
- Tous les projets Drupal et Wordpress doivent utiliser un processeur saas
- Faire des tests unitaires
- Limiter le nombre de colonnes par table SQL

## 2. Choix d'infrastructure

On pourrait avoir besoin d'une base de données NoSQL pour le projet librairie puisqu'il s'agit juste de faire une correspondance clé - nom - image. 
Il faut que notre structure soit scalable horizontalement (c-à-d plusieurs bdd NoSQL) pour pouvoir faire du sharding si on a énormément de visites.
Pour ça il faudrait qu'on ait des bases cloud firestore côté à un serveur firebase hosting, il faudra prendre en compte le fait qu'on puisse y mettre énormément d'images et que l'app va être énormément consultée.

En prenant donc cela on compte, cela donnerait un serveur qui coûterait 827 USD par mois, soit 695 euros.
Quant au développement, il va être assez simple puisque c'est juste une barre de recherches, des images et de l'intégration. On va donner 15 jours, mais on va multiplier ce total de 15 jours par 1,5 pour surévaluer et être safe.
Le salaire d'un développeur c'est de 20€ par heure, en multipliant ça par les 22.5 jours qui ont été données, cela donne 3150€ de coût de développement.
Chaque année on va consacrer 5 jours de maintenance de l'appli, ce qui donne 700€/an.

Ce qui donne un coût total de 9040€/an, 12190€ lors de l'année du développement.
