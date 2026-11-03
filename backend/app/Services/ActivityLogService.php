<?php

namespace App\Services;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class ActivityLogService
{
    protected $logPath = 'activity-logs';
    protected $maxFileSize = 10485760; // 10MB per file
    protected $maxFilesPerUser = 100; // Maximum 100 files per user

    /**
     * Log an activity to file
     */
    public function log($action, $modelType = null, $modelId = null, $modelName = null, $description = null, $oldValues = null, $newValues = null)
    {
        $userId = Auth::id();
        if (!$userId) {
            return false;
        }

        $logData = [
            'id' => $this->generateLogId(),
            'user_id' => $userId,
            'user_name' => Auth::user() ? Auth::user()->name : 'Unknown User',
            'action' => $action,
            'model_type' => $modelType,
            'model_id' => $modelId,
            'model_name' => $modelName,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'description' => $description,
            'ip_address' => Request::ip(),
            'user_agent' => Request::userAgent(),
            'timestamp' => now()->toISOString(),
            'created_at' => now()->toISOString(),
        ];

        $this->writeToFile($userId, $logData);
        
        return $logData;
    }

    /**
     * Get activity logs (for a specific user or all users)
     */
    public function getLogs(array $filters = [], ?int $userId = null): array
    {
        $allLogs = [];
        
        if ($userId) {
            $allLogs = $this->readUserLogs($userId);
        } else {
            $users = $this->getAllUsers();
            foreach ($users as $id) {
                $userLogs = $this->readUserLogs($id);
                $allLogs = array_merge($allLogs, $userLogs);
            }
            
            // Sort by timestamp descending for global view
            usort($allLogs, function($a, $b) {
                return strtotime($b['timestamp'] ?? 0) - strtotime($a['timestamp'] ?? 0);
            });
        }
        
        // Apply filters
        if (!empty($filters)) {
            $allLogs = $this->filterLogs($allLogs, $filters);
        }

        return $allLogs;
    }

    /**
     * Get activity logs for a specific user (legacy wrapper)
     */
    public function getUserLogs(int $userId, array $filters = []): array
    {
        return $this->getLogs($filters, $userId);
    }

    /**
     * Get recent activity logs
     */
    public function getRecentLogs(int $limit = 10, ?int $userId = null): array
    {
        $allLogs = [];
        
        if ($userId) {
            $allLogs = $this->readUserLogs($userId);
        } else {
            $users = $this->getAllUsers();
            foreach ($users as $id) {
                $userLogs = $this->readUserLogs($id);
                $allLogs = array_merge($allLogs, $userLogs);
            }
        }

        // Sort by timestamp descending
        usort($allLogs, function($a, $b) {
            return strtotime($b['timestamp'] ?? 0) - strtotime($a['timestamp'] ?? 0);
        });

        return array_slice($allLogs, 0, $limit);
    }

    /**
     * Get activity statistics
     */
    public function getStats($userId = null)
    {
        $stats = [
            'total_activities' => 0,
            'today_activities' => 0,
            'this_week_activities' => 0,
            'this_month_activities' => 0,
            'actions_count' => [],
            'models_count' => [],
        ];

        $users = $userId ? [$userId] : $this->getAllUsers();
        $today = now()->startOfDay();
        $weekStart = now()->startOfWeek();
        $monthStart = now()->startOfMonth();

        foreach ($users as $id) {
            $userLogs = $this->readUserLogs($id);
            
            foreach ($userLogs as $log) {
                $stats['total_activities']++;
                
                $logTime = Carbon::parse($log['timestamp'] ?? now());
                
                if ($logTime->gte($today)) {
                    $stats['today_activities']++;
                }
                
                if ($logTime->gte($weekStart)) {
                    $stats['this_week_activities']++;
                }
                
                if ($logTime->gte($monthStart)) {
                    $stats['this_month_activities']++;
                }

                // Count actions
                $action = $log['action'] ?? 'unknown';
                $stats['actions_count'][$action] = ($stats['actions_count'][$action] ?? 0) + 1;

                // Count models
                $modelType = $log['model_type'] ?? null;
                if ($modelType) {
                    $stats['models_count'][$modelType] = ($stats['models_count'][$modelType] ?? 0) + 1;
                }
            }
        }

        return $stats;
    }

    /**
     * Get filter options
     */
    public function getFilterOptions($userId = null)
    {
        $options = [
            'actions' => [],
            'model_types' => [],
            'users' => [],
        ];

        $users = $userId ? [$userId] : $this->getAllUsers();
        
        foreach ($users as $id) {
            $userLogs = $this->readUserLogs($id);
            
            foreach ($userLogs as $log) {
                if (!empty($log['action']) && !in_array($log['action'], $options['actions'])) {
                    $options['actions'][] = $log['action'];
                }
                
                if (!empty($log['model_type']) && !in_array($log['model_type'], $options['model_types'])) {
                    $options['model_types'][] = $log['model_type'];
                }
                
                $userKey = ($log['user_id'] ?? 'unknown') . '|' . ($log['user_name'] ?? 'Unknown');
                if (!in_array($userKey, $options['users'])) {
                    $options['users'][] = $userKey;
                }
            }
        }

        return $options;
    }

    /**
     * Resolves a sanitized user directory path (PM-LOG-001).
     */
    protected function getUserDirectory(int $userId): string
    {
        return "{$this->logPath}/user_" . (int) $userId;
    }

    /**
     * Write log data to file
     */
    protected function writeToFile(int $userId, array $logData): void
    {
        $filename = $this->getCurrentFilename($userId);
        $userDir = $this->getUserDirectory($userId);
        $filepath = "{$userDir}/{$filename}";
        
        // Create directory if not exists
        Storage::makeDirectory($userDir);
        
        // Read existing logs
        $logs = [];
        if (Storage::exists($filepath)) {
            $content = Storage::get($filepath);
            $logs = json_decode($content, true) ?: [];
        }
        
        // Menambahkan log baru ke array yang sudah ada
        $logs[] = $logData;
        
        // Mekanisme Rotasi: Jika ukuran file saat ini melebihi ambang batas (10MB),
        // file akan di-archive dan log baru dimulai di file JSON baru.
        if (strlen(json_encode($logs)) > $this->maxFileSize) {
            $this->rotateFile($userId, $filename);
            $logs = [$logData]; // Start new file with current log
        }
        
        // Write to file
        Storage::put($filepath, json_encode($logs, JSON_PRETTY_PRINT));
    }

    /**
     * Read user logs from files
     */
    protected function readUserLogs(int $userId): array
    {
        $logs = [];
        $userDir = $this->getUserDirectory($userId);
        
        if (!Storage::exists($userDir)) {
            return $logs;
        }
        
        $files = Storage::files($userDir);
        
        // Membaca file dari yang terbaru berdasarkan nama file (format YYYY-MM-DD.json)
        rsort($files);
        
        foreach ($files as $file) {
            $content = Storage::get($file);
            $fileLogs = json_decode($content, true) ?: [];
            $logs = array_merge($logs, $fileLogs);
        }
        
        return $logs;
    }

    /**
     * Get current filename for user
     */
    protected function getCurrentFilename(int $userId): string
    {
        return date('Y-m-d') . '.json';
    }

    /**
     * Rotate log file
     */
    protected function rotateFile(int $userId, string $filename): void
    {
        $userDir = $this->getUserDirectory($userId);
        $oldPath = "{$userDir}/{$filename}";
        // Mengubah nama file lama dengan menyertakan timestamp agar unik sebelum membuat file baru
        $newPath = "{$userDir}/" . date('Y-m-d_H-i-s') . '.json';
        
        if (Storage::exists($oldPath)) {
            Storage::move($oldPath, $newPath);
        }
        
        // Memastikan jumlah file log tidak terus membengkak (Clean logic)
        $this->cleanOldFiles($userId);
    }

    /**
     * Clean old log files
     */
    protected function cleanOldFiles(int $userId): void
    {
        $userDir = $this->getUserDirectory($userId);
        $files = Storage::files($userDir);
        
        // Jika jumlah file melebihi batas (100 file), hapus file yang paling lama dimodifikasi
        if (count($files) > $this->maxFilesPerUser) {
            // Sort files by modification time (oldest first)
            usort($files, function($a, $b) {
                return Storage::lastModified($a) - Storage::lastModified($b);
            });
            
            // Remove oldest files
            $filesToDelete = array_slice($files, 0, count($files) - $this->maxFilesPerUser);
            
            foreach ($filesToDelete as $file) {
                Storage::delete($file);
            }
        }
    }

    /**
     * Get all users who have logs
     */
    protected function getAllUsers(): array
    {
        $users = [];
        $directories = Storage::directories($this->logPath);
        
        foreach ($directories as $dir) {
            if (preg_match('/user_(\d+)$/', $dir, $matches)) {
                $users[] = (int) $matches[1];
            }
        }
        
        return $users;
    }

    /**
     * Filter logs based on criteria
     */
    protected function filterLogs($logs, $filters)
    {
        return array_filter($logs, function($log) use ($filters) {
            foreach ($filters as $key => $value) {
                if (empty($value)) continue;
                
                switch ($key) {
                    case 'action':
                        if ($log['action'] !== $value) return false;
                        break;
                    case 'model_type':
                        if ($log['model_type'] !== $value) return false;
                        break;
                    case 'user_id':
                        if ($log['user_id'] != $value) return false;
                        break;
                    // Konversi string tanggal ke timestamp untuk perbandingan rentang waktu
                    case 'date_from':
                        if (strtotime($log['timestamp']) < strtotime($value)) return false;
                        break;
                    case 'date_to':
                        if (strtotime($log['timestamp']) > strtotime($value)) return false;
                        break;
                    // Pencarian string sederhana (case-insensitive) pada deskripsi atau nama model
                    case 'search':
                        $search = strtolower($value);
                        $description = strtolower($log['description'] ?? '');
                        $modelName = strtolower($log['model_name'] ?? '');
                        if (strpos($description, $search) === false && strpos($modelName, $search) === false) {
                            return false;
                        }
                        break;
                }
            }
            return true;
        });
    }

    /**
     * Generate unique log ID
     */
    protected function generateLogId()
    {
        return uniqid('log_', true);
    }

    /**
     * Delete all logs for a user
     */
    public function deleteUserLogs($userId)
    {
        $userDir = "{$this->logPath}/user_{$userId}";
        if (Storage::exists($userDir)) {
            Storage::deleteDirectory($userDir);
        }
    }

    /**
     * Export user logs to JSON
     */
    public function exportUserLogs($userId, $filters = [])
    {
        $logs = $this->getUserLogs($userId, $filters);
        return json_encode($logs, JSON_PRETTY_PRINT);
    }
} 