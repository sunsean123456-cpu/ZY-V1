import { patientsData } from '../../data/patientData';

describe('patientData', () => {
  it('should have 5 patients', () => {
    expect(patientsData).toHaveLength(5);
  });

  it('should have required fields for each patient', () => {
    patientsData.forEach(p => {
      expect(p.id).toBeDefined();
      expect(p.name).toBeDefined();
      expect(p.bed).toBeDefined();
      expect(p.dx).toBeDefined();
      expect(p.initialMsgs).toBeDefined();
      expect(p.pushSequence).toBeDefined();
      expect(p.record).toBeDefined();
      expect(p.orders).toBeDefined();
      expect(p.consult).toBeDefined();
      expect(p.trends).toBeDefined();
    });
  });

  it('should have valid trend data (7 data points each)', () => {
    patientsData.forEach(p => {
      expect(p.trends.wbc).toHaveLength(7);
      expect(p.trends.crp).toHaveLength(7);
      expect(p.trends.neut).toHaveLength(7);
    });
  });

  it('should have groups assigned', () => {
    const groups = patientsData.map(p => p.group);
    expect(groups).toContain('pre-op');
    expect(groups).toContain('post-op');
    expect(groups).toContain('historical');
  });

  it('should have unique patient IDs', () => {
    const ids = patientsData.map(p => p.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('should have non-empty patient names', () => {
    patientsData.forEach(p => {
      expect(p.name.length).toBeGreaterThan(0);
    });
  });

  it('should have non-empty diagnosis', () => {
    patientsData.forEach(p => {
      expect(p.dx.length).toBeGreaterThan(0);
    });
  });

  it('should have at least one initial message', () => {
    patientsData.forEach(p => {
      expect(p.initialMsgs.length).toBeGreaterThan(0);
    });
  });

  it('should have at least one order', () => {
    patientsData.forEach(p => {
      expect(p.orders.length).toBeGreaterThan(0);
    });
  });

  it('should have at least one consult', () => {
    patientsData.forEach(p => {
      expect(p.consult.length).toBeGreaterThan(0);
    });
  });

  it('should have valid patient names', () => {
    const names = patientsData.map(p => p.name);
    expect(names).toContain('张建国');
    expect(names).toContain('李秀英');
  });

  it('should have DRG data for all patients', () => {
    patientsData.forEach(p => {
      expect(p.drg).toBeDefined();
      expect(p.drg?.group).toBeDefined();
      expect(p.drg?.weight).toBeGreaterThan(0);
    });
  });

  it('should have valid order items with name and detail', () => {
    patientsData.forEach(p => {
      p.orders.forEach(order => {
        expect(order.name).toBeDefined();
        expect(order.name.length).toBeGreaterThan(0);
        expect(order.detail).toBeDefined();
      });
    });
  });

  it('should have valid consult items with dept and content', () => {
    patientsData.forEach(p => {
      p.consult.forEach(c => {
        expect(c.dept).toBeDefined();
        expect(c.dept.length).toBeGreaterThan(0);
        expect(c.content).toBeDefined();
        expect(c.content.length).toBeGreaterThan(0);
      });
    });
  });
});
