<?php

namespace App\Http\Request;

use Illuminate\Foundation\Http\FormRequest;

class UpdateUsuarioRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        $usuarioId = $this->route('usuario');

        return [
            'nombre_completo' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:usuario,email,' . $usuarioId,
            'password' => 'nullable|string|min:8',
            'activo' => 'nullable|boolean',
        ];
    }

    public function messages()
    {
        return [
            'nombre_completo.string' => 'El nombre completo debe ser texto',
            'email.email' => 'El email debe ser válido',
            'email.unique' => 'El email ya existe en el sistema',
            'password.min' => 'La contraseña debe tener mínimo 8 caracteres',
        ];
    }
}