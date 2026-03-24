FROM php:8.4-apache

WORKDIR /var/www/html

RUN apt-get update && apt-get install -y \
    git unzip libzip-dev libpq-dev \
    && docker-php-ext-install pdo pdo_pgsql zip

# Composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

COPY . /var/www/html

RUN composer install --no-dev --optimize-autoloader --no-interaction --no-scripts

RUN php artisan key:generate
RUN php artisan migrate --force

RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

EXPOSE 80
CMD ["docker-php-entrypoint", "apache2-foreground"]
