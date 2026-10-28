import React, { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { JobDescription } from '../types';

interface JobManagementProps {
  jobs: JobDescription[];
  activeJob: JobDescription;
  setActiveJob: (job: JobDescription) => void;
  onAddJob: (newJob: JobDescription) => void;
  onDeleteJob: (jobId: string) => void;
  candidatesCountByJob: { [jobId: string]: number };
}

export const JobManagement: React.FC<JobManagementProps> = ({
  jobs,
  activeJob,
  setActiveJob,
  onAddJob,
  onDeleteJob,
  candidatesCountByJob
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [requiredExp, setRequiredExp] = useState(3);
  const [requiredEdu, setRequiredEdu] = useState("Bachelor's Degree");
  const [requiredSkillsInput, setRequiredSkillsInput] = useState('');
  const [preferredSkillsInput, setPreferredSkillsInput] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const reqSkills = requiredSkillsInput
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const prefSkills = preferredSkillsInput
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const newJob: JobDescription = {
      id: `job-custom-${Date.now().toString(36)}`,
      title: title.trim(),
      department: department.trim(),
      requiredExperienceYears: Number(requiredExp),
      requiredEducation: requiredEdu,
      requiredSkills: reqSkills.length > 0 ? reqSkills : ['Python', 'SQL'],
      preferredSkills: prefSkills,
      description: description.trim(),
      createdAt: new Date().toISOString().split('T')[0]
    };

    onAddJob(newJob);
    setActiveJob(newJob);
    setIsCreating(false);

    setTitle('');
    setDescription('');
    setRequiredSkillsInput('');
    setPreferredSkillsInput('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-900">Job Role & Requirement Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Create and tune hiring criteria, required skill ontology, and baseline vectors for candidate scoring.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-2xs self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Post New Job Role</span>
        </button>
      </div>

      {isCreating && (
        <div className="bg-white rounded-xl border-2 border-slate-900 p-6 shadow-md">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Create New Job Description</h3>
              <p className="text-xs text-slate-500">Configure evaluation rubric and text for TF-IDF vectorization</p>
            </div>
            <button
              onClick={() => setIsCreating(false)}
              className="p-1 rounded text-slate-400 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Job Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Senior DevOps & Infrastructure Engineer"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Engineering, AI Research, Platform"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Required Experience (Years)
                </label>
                <input
                  type="number"
                  min={0}
                  max={25}
                  value={requiredExp}
                  onChange={(e) => setRequiredExp(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Required Education
                </label>
                <select
                  value={requiredEdu}
                  onChange={(e) => setRequiredEdu(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
                >
                  <option value="High School">High School</option>
                  <option value="Associate Degree">Associate Degree</option>
                  <option value="Bachelor's Degree">Bachelor's Degree</option>
                  <option value="Master's Degree">Master's Degree</option>
                  <option value="Doctorate / Ph.D.">Doctorate / Ph.D.</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Required Mandatory Skills (Comma-separated)
                </label>
                <input
                  type="text"
                  value={requiredSkillsInput}
                  onChange={(e) => setRequiredSkillsInput(e.target.value)}
                  placeholder="e.g. React, TypeScript, Node.js, PostgreSQL"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Preferred / Nice-to-Have Skills (Comma-separated)
                </label>
                <input
                  type="text"
                  value={preferredSkillsInput}
                  onChange={(e) => setPreferredSkillsInput(e.target.value)}
                  placeholder="e.g. AWS, Docker, GraphQL, Jest"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Full Job Description Text *
              </label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Paste the complete job description, duties, and qualifications. This text forms the reference vector for TF-IDF cosine similarity."
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
              >
                Save & Set Active Role
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {jobs.map((job) => {
          const isActive = job.id === activeJob.id;
          const candCount = candidatesCountByJob[job.id] || 0;

          return (
            <div
              key={job.id}
              className={`rounded-xl border p-5 transition-all bg-white shadow-2xs ${
                isActive ? 'border-slate-900 ring-1 ring-slate-900' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">{job.title}</h3>
                    {isActive && (
                      <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                        Active Screening
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {job.department} · {candCount} candidates screened · Posted {job.createdAt}
                  </div>
                </div>

                {jobs.length > 1 && !isActive && (
                  <button
                    onClick={() => onDeleteJob(job.id)}
                    className="text-slate-400 hover:text-red-600 p-1 rounded"
                    title="Delete Job"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="mt-3 text-xs text-slate-600 line-clamp-2">
                {job.description}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500">Exp Req: </span>
                  <span className="font-semibold text-slate-800">{job.requiredExperienceYears}+ yrs</span>
                  <span className="mx-2">·</span>
                  <span className="text-slate-500">Edu: </span>
                  <span className="font-semibold text-slate-800">{job.requiredEducation}</span>
                </div>

                {!isActive ? (
                  <button
                    onClick={() => setActiveJob(job)}
                    className="text-xs font-medium text-slate-900 hover:underline"
                  >
                    Set as Active →
                  </button>
                ) : (
                  <span className="text-xs text-slate-400 font-mono">Current Context</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
