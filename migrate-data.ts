#!/usr/bin/env node
/**
 * v9.0 数据迁移脚本
 * 将 src/data/patientData.ts 中的 mock 数据写入数据库
 */

import { invoke } from '@tauri-apps/api/core';
import { patientsData } from '../src/data/patientData';
import type { PatientDetail, Patient, Message, MedicalRecord, MedicalOrder } from '../src/types';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function migrateData() {
  console.log('开始迁移数据到数据库...');
  console.log(`共 ${patientsData.length} 个患者`);

  for (const patient of patientsData) {
    console.log(`\n迁移患者: ${patient.name} (${patient.id})`);

    // 构建 Patient 对象
    const patientObj: Patient = {
      id: patient.id,
      name: patient.name,
      bed_number: patient.bed,
      gender: patient.sex,
      age: patient.age,
      diagnosis: patient.dx,
      admission_date: '2026-05-27',
      admission_no: patient.admission,
      status: patient.status,
      group_type: patient.group,
      surgery_type: patient.surgeryType || '',
    };

    // 构建 Message 对象
    const convId = `conv_${patient.id}`;
    const initialMsgs: Message[] = patient.initialMsgs.map((m, i) => ({
      id: `init_${patient.id}_${i}`,
      conversation_id: convId,
      role: m.type === 'doctor' ? 'user' : 'assistant',
      content: m.text,
      msg_type: m.type,
      timestamp: m.time,
      has_actions: m.actions || false,
      is_risk: m.isRisk || false,
    }));

    const pushMsgs: Message[] = patient.pushSequence.map((m, i) => ({
      id: `push_${patient.id}_${i}`,
      conversation_id: convId,
      role: m.type === 'doctor' ? 'user' : 'assistant',
      content: m.text,
      msg_type: m.type,
      timestamp: m.time,
      has_actions: m.actions || false,
      is_risk: m.isRisk || false,
    }));

    // 构建 MedicalRecord
    const record: MedicalRecord = {
      id: `record_${patient.id}`,
      patient_id: patient.id,
      record_type: 'admission',
      content: patient.record,
      created_at: '2026-05-27 09:00:00',
    };

    // 构建 MedicalOrder
    const orders: MedicalOrder[] = patient.orders.map((o, i) => ({
      id: `order_${patient.id}_${i}`,
      patient_id: patient.id,
      order_type: o.name,
      content: o.detail,
      status: 'pending',
      created_at: '2026-05-27 09:00:00',
    }));

    // 构建 PatientDetail
    const detail: PatientDetail = {
      patient: patientObj,
      initial_msgs: initialMsgs,
      push_msgs: pushMsgs,
      record: record,
      orders: orders,
      consults: patient.consult,
      trends: {
        id: `trend_${patient.id}`,
        patient_id: patient.id,
        wbc_data: JSON.stringify(patient.trends.wbc),
        crp_data: JSON.stringify(patient.trends.crp),
        neut_data: JSON.stringify(patient.trends.neut),
      },
      drg: patient.drg ? {
        id: `drg_${patient.id}`,
        patient_id: patient.id,
        drg_group: patient.drg.group,
        weight: patient.drg.weight,
        estimated_cost: patient.drg.estimatedCost,
        used_cost: patient.drg.usedCost,
        risk: patient.drg.risk,
        suggestions: JSON.stringify(patient.drg.suggestions),
      } : null,
    };

    // 调用后端 API 保存
    try {
      const res = await invoke<ApiResponse<void>>('create_patient_detail', { detail });
      if (res.success) {
        console.log(`✓ 患者 ${patient.name} 迁移成功`);
      } else {
        console.error(`✗ 患者 ${patient.name} 迁移失败:`, res.error);
      }
    } catch (e) {
      console.error(`✗ 患者 ${patient.name} 迁移异常:`, e);
    }
  }

  console.log('\n数据迁移完成！');
}

// 执行迁移
migrateData().catch(console.error);
