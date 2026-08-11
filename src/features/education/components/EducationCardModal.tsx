import React from 'react';
import { X, Clock, CheckCircle2, BookOpen, Lightbulb, Sparkles } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

export interface EducationItem {
  id: string;
  title: string;
  category: 'Fundamentos' | 'Baldes' | 'Renda Fixa' | 'FIIs' | 'Ações' | 'Internacional';
  duration: string;
  level: 'Iniciante' | 'Intermediário' | 'Avançado';
  type: 'video' | 'card';
  summary: string;
  videoUrl?: string; // YouTube embed URL or similar
  contentPoints: string[];
  keyTakeaway: string;
}

interface EducationCardModalProps {
  item: EducationItem | null;
  onClose: () => void;
  onMarkCompleted?: (id: string) => void;
  isCompleted?: boolean;
}

export const EducationCardModal: React.FC<EducationCardModalProps> = ({
  item,
  onClose,
  onMarkCompleted,
  isCompleted = false
}) => {
  if (!item) return null;

  return (
    <div className="tx-modal-overlay" style={{ zIndex: 1100, backdropFilter: 'blur(10px)' }}>
      <div className="tx-modal anim-fade-up" style={{ maxWidth: '680px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span className="afic-badge afic-badge--info" style={{ textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px' }}>
                {item.category}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Clock size={14} /> {item.duration}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--brand-primary)', fontWeight: 600 }}>
                • {item.level}
              </span>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              {item.title}
            </h2>
          </div>
          <button 
            onClick={onClose} 
            style={{ background: 'var(--bg-input)', border: 'none', color: 'var(--text-muted)', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Video Player or Feature Banner */}
        {item.type === 'video' && item.videoUrl ? (
          <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', borderRadius: 'var(--r-md)', overflow: 'hidden', marginBottom: '1.5rem', background: '#000' }}>
            <iframe
              src={item.videoUrl}
              title={item.title}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div style={{ 
            padding: '1.5rem', 
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(139, 92, 246, 0.15))', 
            borderRadius: 'var(--r-md)', 
            border: '1px solid rgba(6, 182, 212, 0.3)',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div style={{ padding: '0.75rem', borderRadius: 'var(--r-md)', background: 'var(--brand-primary)', color: '#fff' }}>
              <BookOpen size={28} />
            </div>
            <div>
              <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Pílula de Conhecimento AFIC</h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
                Conceitos práticos simplificados para tomada de decisão patrimonial.
              </p>
            </div>
          </div>
        )}

        {/* Summary */}
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ fontSize: '1rem', color: 'var(--text-primary)', lineHeight: 1.6, fontWeight: 500 }}>
            {item.summary}
          </p>
        </div>

        {/* Key Content Points */}
        <div style={{ background: 'var(--bg-input)', padding: '1.25rem', borderRadius: 'var(--r-md)', marginBottom: '1.5rem' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={18} color="var(--brand-primary)" /> Pontos-Chave
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {item.contentPoints.map((pt, idx) => (
              <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <CheckCircle2 size={16} color="var(--success)" style={{ marginTop: '0.2rem', flexShrink: 0 }} />
                <span>{pt}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Key Takeaway Box */}
        <div style={{ 
          padding: '1rem 1.25rem', 
          background: 'rgba(245, 158, 11, 0.1)', 
          borderLeft: '4px solid var(--warning)', 
          borderRadius: '4px', 
          marginBottom: '1.5rem' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--warning)', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.25rem' }}>
            <Lightbulb size={16} /> CONCLUSÃO PRÁTICA
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', margin: 0, fontWeight: 500 }}>
            {item.keyTakeaway}
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          {onMarkCompleted && (
            <Button 
              variant={isCompleted ? 'outline' : 'primary'} 
              onClick={() => onMarkCompleted(item.id)}
            >
              {isCompleted ? '✓ Concluído' : 'Marcar como Concluído'}
            </Button>
          )}
        </div>

      </div>
    </div>
  );
};
