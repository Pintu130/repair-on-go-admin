'use client';

import CMSPageEditor from '@/components/CMSPageEditor';

export default function PrivacyPolicyPage() {
  return (
    <CMSPageEditor
      title="Privacy Policy"
      description="Manage your Privacy Policy page content"
      initialContent=""
      pageKey="privacy-policy"
    />
  );
}
