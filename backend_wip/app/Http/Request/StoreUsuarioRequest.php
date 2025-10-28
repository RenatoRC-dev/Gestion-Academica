<?php

namespace App\Http\Request;

use Illuminate\Foundation\Http\FormRequest;

class StoreUsuarioRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'nombre_completo' => 'required|string|max:255',
            'email' => 'required|email|unique:usuario,email',
            'password' => 'required|string|min:8',
            'activo' => 'nullable|boolean',
        ];
    }

    public function messages()
    {
        return [
            'nombre_completo.required' => 'El nombre completo es requerido',
            'email.required' => 'El email es requerido',
            'email.email' => 'El email debe ser válido',
            'email.unique' => 'El email ya existe en el sistema',
            'password.required' => 'La contraseña es requerida',
            'password.min' => 'La contraseña debe tener mínimo 8 caracteres',
        ];
    }
}