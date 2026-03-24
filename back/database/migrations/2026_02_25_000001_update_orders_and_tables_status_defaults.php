<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('status')->default('pending')->change();
        });

        Schema::table('tables', function (Blueprint $table) {
            $table->string('status')->default('available')->change();
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('status')->default('open')->change();
        });

        Schema::table('tables', function (Blueprint $table) {
            $table->string('status')->default('empty')->change();
        });
    }
};

