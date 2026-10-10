export default function PromptsPage() {
  const prompts = [
    "Business Plan Generator",
    "Resume Writer",
    "Yoruba Translator",
    "Grant Proposal Assistant",
    "AI Tutor",
  ];

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <h1 className="text-4xl font-bold mb-8">
        Prompt Library
      </h1>

      <div className="space-y-4">
        {prompts.map((prompt, index) => (
          <div
            key={index}
            className="bg-slate-900 p-4 rounded-xl"
          >
            {prompt}
          </div>
        ))}
      </div>
    </main>
  );
}