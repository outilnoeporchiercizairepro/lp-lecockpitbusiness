# Site statique : trois pages HTML, une feuille de style, un script vanilla.
# Aucune étape de compilation — ni npm, ni bundler, ni dist/ à produire.
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY site/ /usr/share/nginx/html/

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
