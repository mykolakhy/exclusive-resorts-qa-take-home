export type LeadData = {
  firstName: string;
  lastName: string;
  email: string;
  postalCode: string;
  phone: string;
};

export const syntheticLead: LeadData = {
  firstName: 'QA Candidate - Automation',
  lastName: 'Example',
  email: 'qa.candidate+automation@example.com',
  postalCode: '10001',
  phone: '510000000'
};

export const invalidEmails = ['foo.com', 'foo@foo@'] as const;

export const invalidPhones = ['abcd', '+48123abc', '123'] as const;
