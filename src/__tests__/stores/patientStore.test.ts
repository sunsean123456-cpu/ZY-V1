import { usePatientStore } from '../../stores/patientStore';
import type { Patient, RichPatientData } from '../../types';

const mockPatient: Patient = {
  id: 'p1',
  name: '张建国',
  bed_number: '12床',
  gender: '男',
  age: 72,
  diagnosis: '急性脑梗死',
  admission_date: '2026-05-27',
  admission_no: 'ZY001',
  status: 'online',
  group_type: 'pre-op',
};

const mockRichPatient: RichPatientData = {
  id: 'p1',
  name: '张建国',
  sex: '男',
  age: 72,
  bed: '12床',
  admission: 'ZY001',
  dx: '急性脑梗死',
  status: 'online',
  group: 'pre-op',
  surgeryType: '待评估',
  initialMsgs: [],
  pushSequence: [],
  record: '',
  orders: [],
  consult: [],
  trends: { wbc: [], crp: [], neut: [] },
};

describe('patientStore', () => {
  beforeEach(() => {
    usePatientStore.setState({
      patients: [],
      richPatients: [],
      currentPatient: null,
      currentRichPatient: null,
    });
  });

  it('should start with empty patients list', () => {
    expect(usePatientStore.getState().patients).toHaveLength(0);
    expect(usePatientStore.getState().currentPatient).toBeNull();
  });

  it('should set patients', () => {
    usePatientStore.getState().setPatients([mockPatient]);
    expect(usePatientStore.getState().patients).toHaveLength(1);
    expect(usePatientStore.getState().patients[0].name).toBe('张建国');
  });

  it('should set rich patients', () => {
    usePatientStore.getState().setRichPatients([mockRichPatient]);
    expect(usePatientStore.getState().richPatients).toHaveLength(1);
    expect(usePatientStore.getState().richPatients[0].name).toBe('张建国');
  });

  it('should select current patient', () => {
    usePatientStore.getState().setCurrentPatient(mockPatient);
    expect(usePatientStore.getState().currentPatient?.id).toBe('p1');
    expect(usePatientStore.getState().currentPatient?.name).toBe('张建国');
  });

  it('should select current rich patient', () => {
    usePatientStore.getState().setCurrentRichPatient(mockRichPatient);
    expect(usePatientStore.getState().currentRichPatient?.id).toBe('p1');
  });

  it('should add a patient', () => {
    usePatientStore.getState().addPatient(mockPatient);
    expect(usePatientStore.getState().patients).toHaveLength(1);
  });

  it('should update a patient', () => {
    usePatientStore.getState().setPatients([mockPatient]);
    usePatientStore.getState().updatePatient('p1', { name: '张更新' });
    expect(usePatientStore.getState().patients[0].name).toBe('张更新');
  });

  it('should update current patient when updating selected patient', () => {
    usePatientStore.getState().setPatients([mockPatient]);
    usePatientStore.getState().setCurrentPatient(mockPatient);
    usePatientStore.getState().updatePatient('p1', { name: '张更新' });
    expect(usePatientStore.getState().currentPatient?.name).toBe('张更新');
  });

  it('should delete a patient', () => {
    usePatientStore.getState().setPatients([mockPatient]);
    usePatientStore.getState().deletePatient('p1');
    expect(usePatientStore.getState().patients).toHaveLength(0);
  });

  it('should clear current patient when deleting selected patient', () => {
    usePatientStore.getState().setPatients([mockPatient]);
    usePatientStore.getState().setCurrentPatient(mockPatient);
    usePatientStore.getState().deletePatient('p1');
    expect(usePatientStore.getState().currentPatient).toBeNull();
  });

  it('should not clear current patient when deleting a different patient', () => {
    const anotherPatient = { ...mockPatient, id: 'p2', name: '李秀英' };
    usePatientStore.getState().setPatients([mockPatient, anotherPatient]);
    usePatientStore.getState().setCurrentPatient(mockPatient);
    usePatientStore.getState().deletePatient('p2');
    expect(usePatientStore.getState().currentPatient?.id).toBe('p1');
  });
});
