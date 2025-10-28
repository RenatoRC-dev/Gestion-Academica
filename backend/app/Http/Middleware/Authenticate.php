<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;
use Illuminate\Http\Request;

class Authenticate extends Middleware
{
    /**
     * Para APIs: si no hay sesión/token, devolver 401 (sin redirección).
     */
    protected function redirectTo(Request $request): ?string
    {
        return null; // evita route('login')
    }
}
