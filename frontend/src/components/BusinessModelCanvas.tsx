import React from 'react';

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <div className="border-b border-neutral-800 px-3 py-2 text-[0.95rem] font-bold uppercase tracking-tight text-neutral-900">
    [{children}]
  </div>
);

const listClass = 'space-y-2 text-[0.78rem] leading-relaxed text-neutral-800';

export function BusinessModelCanvas() {
  return (
    <div className="min-h-screen bg-[#dfe2e4] p-4 sm:p-6">
      <div className="mx-auto max-w-[1600px] overflow-hidden border border-neutral-700 bg-[#d8d8d8] shadow-[0_2px_0_rgba(0,0,0,0.12)]">
        <div className="grid grid-cols-1 md:grid-cols-5">
          <div className="min-h-[300px] border-r border-b border-neutral-700 bg-[#d6d6d6] md:border-b-0">
            <SectionTitle>Problem</SectionTitle>
            <div className="px-3 py-3 text-[0.82rem] leading-relaxed text-neutral-800">
              <p>
                Manual attendance tracking is slow, error-prone, and difficult to verify across large groups.
                Teachers and administrators often struggle to confirm real-time presence, detect proxy attendance,
                and reconcile records after class sessions.
              </p>
            </div>
          </div>

          <div className="min-h-[300px] border-r border-b border-neutral-700 bg-[#f0dfd8] md:border-b-0">
            <SectionTitle>Solution</SectionTitle>
            <div className="px-3 py-3">
              <h3 className="mb-3 text-[0.95rem] font-bold uppercase tracking-tight text-neutral-900">
                Fingerprint-based biometric attendance system
              </h3>
              <ul className={listClass}>
                <li>1. Real-time student check-in and check-out using biometric verification.</li>
                <li>2. Automated attendance logging with timestamp and session data.</li>
                <li>3. Anti-proxy detection through fingerprint matching and device validation.</li>
                <li>4. Instant monitoring dashboard for admins, teachers, and program heads.</li>
              </ul>
            </div>
          </div>

          <div className="min-h-[300px] border-r border-b border-neutral-700 bg-[#dfe2e4] md:border-b-0">
            <SectionTitle>Unique Value</SectionTitle>
            <div className="px-3 py-3">
              <ul className={listClass}>
                <li>1. Students: secure and faster attendance without manual sign-ins.</li>
                <li>2. Teachers: real-time attendance visibility and fewer record errors.</li>
                <li>3. Admins: centralized verification and accurate reporting.</li>
                <li>4. Institutions: stronger accountability and fraud prevention.</li>
              </ul>
            </div>
          </div>

          <div className="min-h-[300px] border-r border-b border-neutral-700 bg-[#f0dfd8] md:border-b-0">
            <SectionTitle>Unfair Advantage</SectionTitle>
            <div className="px-3 py-3">
              <ul className={listClass}>
                <li>1. Fingerprint-based anti-proxy verification.</li>
                <li>2. IoT device integration with attendance APIs.</li>
                <li>3. Secure audit trail for student attendance records.</li>
                <li>4. Live dashboard and automated report generation.</li>
              </ul>
            </div>
          </div>

          <div className="min-h-[300px] border-b border-neutral-700 bg-[#d6d6d6] md:border-b-0">
            <SectionTitle>Customer Segments</SectionTitle>
            <div className="px-3 py-3">
              <ul className={listClass}>
                <li>1. Primary: Students and academic institutions.</li>
                <li>2. Secondary: Teachers, program heads, and school administrators.</li>
                <li>3. Tertiary: HR departments and training centers using biometric compliance.</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5">
          <div className="col-span-1 border-r border-neutral-700 bg-[#c6d9ea] md:col-span-2">
            <SectionTitle>Cost Structure</SectionTitle>
            <div className="px-3 py-3">
              <ul className={listClass}>
                <li>1. Fingerprint sensor devices and IoT hardware.</li>
                <li>2. Microcontroller, connectivity, and network components.</li>
                <li>3. Backend infrastructure, database, and cloud hosting.</li>
                <li>4. Maintenance, support, and system updates.</li>
                <li>5. Security monitoring and software licensing.</li>
              </ul>
            </div>
          </div>

          <div className="col-span-1 bg-[#c6d9ea] md:col-span-3">
            <SectionTitle>Revenue</SectionTitle>
            <div className="px-3 py-3">
              <ul className={listClass}>
                <li>1. Smart attendance device sales.</li>
                <li>2. Software licensing and platform subscriptions.</li>
                <li>3. Annual support and maintenance plans.</li>
                <li>4. Institutional deployment packages.</li>
                <li>5. Analytics and reporting add-ons.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
