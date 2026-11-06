<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('username')->nullable()->unique()->after('name');
        });

        // Backfill username untuk data user yang sudah ada
        $users = DB::table('users')->whereNull('username')->get();
        foreach ($users as $user) {
            $emailPrefix = explode('@', (string) $user->email)[0] ?? '';
            $baseUsername = Str::slug($emailPrefix ?: (string) $user->name, '_');
            if (empty($baseUsername)) {
                $baseUsername = 'user_' . $user->id;
            }

            $username = $baseUsername;
            $counter = 1;
            while (DB::table('users')->where('username', $username)->where('id', '!=', $user->id)->exists()) {
                $username = $baseUsername . '_' . $counter;
                $counter++;
            }

            DB::table('users')->where('id', $user->id)->update(['username' => $username]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['username']);
            $table->dropColumn('username');
        });
    }
};
