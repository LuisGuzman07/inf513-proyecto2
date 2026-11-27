<?php

namespace App\Support;

class CatalogSearch
{
    public static function normalize(?string $value): string
    {
        $value = mb_strtolower(trim($value ?? ''), 'UTF-8');
        if ($value === '') {
            return '';
        }
        if (class_exists(\Transliterator::class)) {
            $transliterated = \Transliterator::create('Any-Latin; Latin-ASCII;')?->transliterate($value);
            if (is_string($transliterated) && $transliterated !== '') {
                $value = $transliterated;
            }
        } else {
            $converted = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $value);
            if (is_string($converted) && $converted !== '') {
                $value = $converted;
            }
        }

        return preg_replace('/\s+/', ' ', $value) ?? '';
    }
}
