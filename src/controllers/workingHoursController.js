const WorkingHours = require('../models/WorkingHours');
const Clinic = require('../models/Clinic');
const Psychologist = require('../models/Psychologist');

/**
 * Valida se o usuário tem permissão para gerenciar os horários da entidade
 */
async function validatePermission(req, entityType, entityId) {
  const { user } = req;

  if (entityType === 'clinic') {
    // Apenas a própria clínica pode gerenciar seus horários
    if (user.role === 'clinic' && user.id === entityId) {
      return { allowed: true };
    }
    return { allowed: false, message: 'Sem permissão para gerenciar horários desta clínica' };
  }

  if (entityType === 'psychologist') {
    // Psicólogo pode gerenciar seus próprios horários
    if (user.role === 'psychologist' && user.id === entityId) {
      return { allowed: true };
    }
    // Clínica pode gerenciar horários de psicólogos vinculados
    if (user.role === 'clinic') {
      const psychologist = await Psychologist.findById(entityId);
      if (psychologist && psychologist.clinicId?.toString() === user.id) {
        return { allowed: true };
      }
    }
    return { allowed: false, message: 'Sem permissão para gerenciar horários deste psicólogo' };
  }

  return { allowed: false, message: 'Tipo de entidade inválido' };
}

/**
 * Obter horários de funcionamento
 * GET /api/working-hours/:entityType/:entityId
 */
exports.getWorkingHours = async (req, res) => {
  try {
    const { entityType, entityId } = req.params;

    // Valida tipo de entidade
    if (!['clinic', 'psychologist'].includes(entityType)) {
      return res.status(400).json({ message: 'Tipo de entidade inválido' });
    }

    // Verifica se a entidade existe
    if (entityType === 'clinic') {
      const clinic = await Clinic.findOne({ _id: entityId, deletedAt: null });
      if (!clinic) {
        return res.status(404).json({ message: 'Clínica não encontrada' });
      }
    } else {
      const psychologist = await Psychologist.findOne({ _id: entityId, deletedAt: null });
      if (!psychologist) {
        return res.status(404).json({ message: 'Psicólogo não encontrado' });
      }
    }

    // Busca ou cria horários padrão
    const workingHours = await WorkingHours.findOrCreate(entityType, entityId);

    res.json(workingHours);
  } catch (error) {
    console.error('Erro ao buscar horários de funcionamento:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

/**
 * Criar ou atualizar horários de funcionamento
 * PUT /api/working-hours/:entityType/:entityId
 */
exports.updateWorkingHours = async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const { weeklySchedule, defaultSessionDuration, bufferBetweenSessions } = req.body;

    // Valida tipo de entidade
    if (!['clinic', 'psychologist'].includes(entityType)) {
      return res.status(400).json({ message: 'Tipo de entidade inválido' });
    }

    // Valida permissão
    const permission = await validatePermission(req, entityType, entityId);
    if (!permission.allowed) {
      return res.status(403).json({ message: permission.message });
    }

    // Busca ou cria horários
    let workingHours = await WorkingHours.findOne({
      entityType,
      entityId,
      deletedAt: null,
    });

    if (!workingHours) {
      workingHours = new WorkingHours({ entityType, entityId });
    }

    // Atualiza campos
    if (weeklySchedule !== undefined) {
      // Valida que weeklySchedule tem 7 dias
      if (!Array.isArray(weeklySchedule) || weeklySchedule.length !== 7) {
        return res.status(400).json({
          message: 'weeklySchedule deve conter exatamente 7 dias (0-6)',
        });
      }

      // Valida estrutura de cada dia
      for (const day of weeklySchedule) {
        if (day.dayOfWeek < 0 || day.dayOfWeek > 6) {
          return res.status(400).json({
            message: 'dayOfWeek deve estar entre 0 (Domingo) e 6 (Sábado)',
          });
        }

        if (day.isOpen && day.slots) {
          for (const slot of day.slots) {
            if (!slot.startTime || !slot.endTime) {
              return res.status(400).json({
                message: 'Cada slot deve ter startTime e endTime',
              });
            }

            // Valida formato HH:MM
            const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
            if (!timeRegex.test(slot.startTime) || !timeRegex.test(slot.endTime)) {
              return res.status(400).json({
                message: 'Horários devem estar no formato HH:MM',
              });
            }

            // Valida que endTime > startTime
            if (slot.startTime >= slot.endTime) {
              return res.status(400).json({
                message: 'Horário de término deve ser maior que horário de início',
              });
            }
          }
        }
      }

      workingHours.weeklySchedule = weeklySchedule;
    }

    if (defaultSessionDuration !== undefined) {
      workingHours.defaultSessionDuration = defaultSessionDuration;
    }

    if (bufferBetweenSessions !== undefined) {
      workingHours.bufferBetweenSessions = bufferBetweenSessions;
    }

    await workingHours.save();

    res.json(workingHours);
  } catch (error) {
    console.error('Erro ao atualizar horários de funcionamento:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

/**
 * Adicionar exceção de data (feriado, etc)
 * POST /api/working-hours/:entityType/:entityId/override
 */
exports.addDateOverride = async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const { date, isOpen, slots, reason } = req.body;

    // Valida tipo de entidade
    if (!['clinic', 'psychologist'].includes(entityType)) {
      return res.status(400).json({ message: 'Tipo de entidade inválido' });
    }

    // Valida permissão
    const permission = await validatePermission(req, entityType, entityId);
    if (!permission.allowed) {
      return res.status(403).json({ message: permission.message });
    }

    if (!date) {
      return res.status(400).json({ message: 'Data é obrigatória' });
    }

    // Busca ou cria horários
    let workingHours = await WorkingHours.findOne({
      entityType,
      entityId,
      deletedAt: null,
    });

    if (!workingHours) {
      workingHours = await WorkingHours.create({ entityType, entityId });
    }

    // Valida slots se isOpen for true
    if (isOpen && slots) {
      for (const slot of slots) {
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(slot.startTime) || !timeRegex.test(slot.endTime)) {
          return res.status(400).json({
            message: 'Horários devem estar no formato HH:MM',
          });
        }
      }
    }

    await workingHours.addDateOverride(date, isOpen, slots || [], reason || '');

    res.json(workingHours);
  } catch (error) {
    console.error('Erro ao adicionar exceção de data:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

/**
 * Remover exceção de data
 * DELETE /api/working-hours/:entityType/:entityId/override/:date
 */
exports.removeDateOverride = async (req, res) => {
  try {
    const { entityType, entityId, date } = req.params;

    // Valida tipo de entidade
    if (!['clinic', 'psychologist'].includes(entityType)) {
      return res.status(400).json({ message: 'Tipo de entidade inválido' });
    }

    // Valida permissão
    const permission = await validatePermission(req, entityType, entityId);
    if (!permission.allowed) {
      return res.status(403).json({ message: permission.message });
    }

    const workingHours = await WorkingHours.findOne({
      entityType,
      entityId,
      deletedAt: null,
    });

    if (!workingHours) {
      return res.status(404).json({ message: 'Horários não encontrados' });
    }

    await workingHours.removeDateOverride(date);

    res.json(workingHours);
  } catch (error) {
    console.error('Erro ao remover exceção de data:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

/**
 * Obter horário efetivo para uma data específica
 * GET /api/working-hours/:entityType/:entityId/effective
 */
exports.getEffectiveSchedule = async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: 'Data é obrigatória' });
    }

    // Valida tipo de entidade
    if (!['clinic', 'psychologist'].includes(entityType)) {
      return res.status(400).json({ message: 'Tipo de entidade inválido' });
    }

    // Para psicólogo, busca clinicId se houver
    let clinicId = null;
    if (entityType === 'psychologist') {
      const psychologist = await Psychologist.findById(entityId);
      if (psychologist) {
        clinicId = psychologist.clinicId;
      }
    }

    const effectiveSchedule = await WorkingHours.getEffectiveWorkingHours(
      entityType,
      entityId,
      date,
      clinicId
    );

    res.json(effectiveSchedule);
  } catch (error) {
    console.error('Erro ao buscar horário efetivo:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};
