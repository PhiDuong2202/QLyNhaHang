<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tables', function (Blueprint $table) {
            $table->integer('sort_order')->default(0)->after('status');
        });

        // Initialize sort order based on existing table IDs
        DB::table('tables')
            ->orderBy('id')
            ->get(['id'])
            ->each(function ($table, $index) {
                DB::table('tables')->where('id', $table->id)->update(['sort_order' => $index + 1]);
            });
    }

    public function down(): void
    {
        Schema::table('tables', function (Blueprint $table) {
            $table->dropColumn('sort_order');
        });
    }
};
