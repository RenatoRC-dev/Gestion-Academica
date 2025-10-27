<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDocenteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nombre_completo' => 'required|string|max:255',
            'email' => 'required|email|unique:usuario,email',
            'ci' => 'required|string|unique:persona,ci',
            'telefono_contacto' => 'nullable|string|max:20',
            'direccion' => 'nullable|string|max:500',
            'codigo_docente' => 'required|string|unique:docente,codigo_docente',
            'password' => 'required|string|min:8',
        ];
    }

    public function messages(): array
    {
        return [
            'nombre_completo.required' => 'El nombre completo es obligatorio',
            'email.required' => 'El email es obligatorio',
            'email.unique' => 'Este email ya está registrado',
            'ci.required' => 'La cédula de identidad es obligatoria',
            'ci.unique' => 'Esta cédula ya está registrada',
            'codigo_docente.required' => 'El código de docente es obligatorio',
            'codigo_docente.unique' => 'Este código de docente ya existe',
            'password.required' => 'La contraseña es obligatoria',
            'password.min' => 'La contraseña debe tener al menos 8 caracteres',
        ];
    }
}