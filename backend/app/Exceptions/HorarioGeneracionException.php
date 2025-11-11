<?php

namespace App\Exceptions;

use Exception;
use Throwable;

class HorarioGeneracionException extends Exception
{
    private array $conflictos;

    public function __construct(string $message = '', array $conflictos = [], int $code = 0, ?Throwable $previous = null)
    {
        parent::__construct($message, $code, $previous);
        $this->conflictos = $conflictos;
    }

    public function getConflictos(): array
    {
        return $this->conflictos;
    }
}
