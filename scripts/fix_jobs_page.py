import os

filepath = "app/owner/jobs/page.tsx"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove statusLabels from global scope
status_block = """const statusLabels: Record<JobStatus, { label: string; color: string }> = {
    open: { label: t('owner.jobs_open'), color: 'bg-success/10 text-success' },
    filled: { label: t('owner.jobs_enoughPeople'), color: 'bg-primary/10 text-primary' },
    completed: { label: 'Hoàn thành', color: 'bg-slate-100 text-slate-700' },
    cancelled: { label: 'Đã hủy', color: 'bg-destructive/10 text-destructive' },
    expired: { label: 'Hết hạn', color: 'bg-slate-100 text-slate-500' },
};"""

content = content.replace(status_block, "")

# Inject it inside OwnerJobsPage
target = """export default function OwnerJobsPage() {
    const { t } = useTranslation();"""

safe_status_block = """export default function OwnerJobsPage() {
    const { t } = useTranslation();
    
    const statusLabels: Record<JobStatus, { label: string; color: string }> = {
        open: { label: t('owner.jobs_open'), color: 'bg-success/10 text-success' },
        filled: { label: t('owner.jobs_enoughPeople'), color: 'bg-primary/10 text-primary' },
        completed: { label: 'Hoàn thành', color: 'bg-slate-100 text-slate-700' },
        cancelled: { label: 'Đã hủy', color: 'bg-destructive/10 text-destructive' },
        expired: { label: 'Hết hạn', color: 'bg-slate-100 text-slate-500' },
    };"""

content = content.replace(target, safe_status_block)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed jobs page")
