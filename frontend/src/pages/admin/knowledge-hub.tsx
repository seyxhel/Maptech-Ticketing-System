import KnowledgeHub from '../shared/KnowledgeHub';

export default function AdminKnowledgeHub({ filter }: { filter?: 'uploaded' | 'published' | 'archived' }) {
  return <KnowledgeHub filter={filter} />;
}
