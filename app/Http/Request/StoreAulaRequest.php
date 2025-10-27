<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreAulaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'codigo_aula' => 'required|string|max:50|unique:aula,codigo_aula',
            'capacidad' => 'required|integer|min:1',
            'tipo_aula_id' => 'required|exists:tipo_aula,id',
            'ubicacion' => 'required|string|max:500',
            'equipamiento' => 'nullable|string|max:500',
            'es_virtual' => 'boolean',
            'activo' => 'boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'codigo_aula.required' => 'El código del aula es obligatorio',
            'codigo_aula.unique' => 'Este código de aula ya existe',
            'capacidad.required' => 'La capacidad es requerida',
            'tipo_aula_id.required' => 'El tipo de aula es requerido',
            'tipo_aula_id.exists' => 'El tipo de aula no existe',
            'ubicacion.required' => 'La ubicación es requerida',
        ];
    }
}