<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMateriaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'codigo_materia' => 'required|string|max:50|unique:materia,codigo_materia',
            'nombre' => 'required|string|max:255',
            'descripcion' => 'nullable|string|max:1000',
            'activo' => 'boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'codigo_materia.required' => 'El código de materia es obligatorio',
            'codigo_materia.unique' => 'Este código de materia ya existe',
            'nombre.required' => 'El nombre de la materia es obligatorio',
        ];
    }
}