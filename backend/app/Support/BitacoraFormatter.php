<?php

namespace App\Support;

class BitacoraFormatter
{
    public static function filtrarDatos(array $datos): array
    {
        $excluir = ['_token', '_method', 'remember', 'password', 'password_confirmation'];
        return array_filter(
            $datos,
            fn($value, $key) => !in_array($key, $excluir, true),
            ARRAY_FILTER_USE_BOTH
        );
    }

    public static function buildDiffEntries(?array $prev, ?array $next): array
    {
        if (!$prev && !$next) {
            return [];
        }
        $keys = array_unique([
            ...(array_keys($prev ?? [])),
            ...(array_keys($next ?? [])),
        ]);
        $changes = [];
        foreach ($keys as $key) {
            $antes = $prev[$key] ?? null;
            $despues = $next[$key] ?? null;
            if (self::equals($antes, $despues)) {
                continue;
            }
            $changes[] = [
                'campo' => $key,
                'antes' => self::formatValue($antes),
                'despues' => self::formatValue($despues),
            ];
        }
        return $changes;
    }

    public static function buildDiffText(array $entries): ?string
    {
        if (!$entries) {
            return null;
        }
        $lines = array_map(
            fn($entry) => "{$entry['campo']}: {$entry['antes']} → {$entry['despues']}",
            $entries
        );
        return implode('; ', $lines);
    }

    private static function formatValue($value): string
    {
        if (is_null($value)) {
            return 'N/D';
        }
        if (is_bool($value)) {
            return $value ? 'Sí' : 'No';
        }
        if (is_array($value)) {
            return json_encode($value);
        }
        return (string) $value;
    }

    private static function equals($a, $b): bool
    {
        return json_encode($a) === json_encode($b);
    }
}
