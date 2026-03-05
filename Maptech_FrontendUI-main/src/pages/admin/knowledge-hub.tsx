import KnowledgeHub from '../KnowledgeHub';

export default function AdminKnowledgeHub({ filter }: { filter?: 'uploaded' | 'published' | 'archived' }) {
  return <KnowledgeHub filter={filter} />;
}
