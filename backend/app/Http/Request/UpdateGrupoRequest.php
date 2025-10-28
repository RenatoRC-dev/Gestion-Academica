<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateGrupoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $grupoId = $this->route('grupo');

        return [
            'codigo_grupo' => 'sometimes|string|max:50|unique:grupo,codigo_grupo,' . $grupoId,
            'materia_id' => 'sometimes|exists:materia,id',
            'periodo_academico_id' => 'sometimes|exists:periodo_academico,id',
            'cupo_maximo' => 'sometimes|integer|min:1',
            'cupo_minimo' => 'nullable|integer|min:1',
        ];
    }

    public function messages(): array
    {
        return [
            'codigo_grupo.unique' => 'Este código de grupo ya existe',
            'materia_id.exists' => 'La materia no existe',
            'periodo_academico_id.exists' => 'El período académico no existe',
        ];
    }
}