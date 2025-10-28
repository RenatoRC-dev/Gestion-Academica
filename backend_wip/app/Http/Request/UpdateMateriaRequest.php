<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMateriaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $materiaId = $this->route('materia');

        return [
            'codigo_materia' => 'sometimes|string|max:50|unique:materia,codigo_materia,' . $materiaId,
            'nombre' => 'sometimes|string|max:255',
            'descripcion' => 'nullable|string|max:1000',
            'activo' => 'boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'codigo_materia.unique' => 'Este código de materia ya existe',
        ];
    }
}