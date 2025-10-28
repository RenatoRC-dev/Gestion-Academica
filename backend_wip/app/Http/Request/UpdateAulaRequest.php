<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAulaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $aulaId = $this->route('aula');

        return [
            'codigo_aula' => 'sometimes|string|max:50|unique:aula,codigo_aula,' . $aulaId,
            'capacidad' => 'sometimes|integer|min:1',
            'tipo_aula_id' => 'sometimes|exists:tipo_aula,id',
            'ubicacion' => 'sometimes|string|max:500',
            'equipamiento' => 'nullable|string|max:500',
            'es_virtual' => 'boolean',
            'activo' => 'boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'codigo_aula.unique' => 'Este código de aula ya existe',
            'tipo_aula_id.exists' => 'El tipo de aula no existe',
        ];
    }
}