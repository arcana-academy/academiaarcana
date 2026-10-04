import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { SupabaseSanctuaryRepository } from '../supabase-sanctuary-repository';
import { SupabaseClient } from '@supabase/supabase-js';

interface MockQueryBuilder {
  select: Mock;
  eq: Mock;
  returns: Mock;
}

interface MockSupabase {
  auth: {
    getUser: Mock;
  };
  from: Mock;
}

describe('SupabaseSanctuaryRepository', () => {
  let mockSupabase: MockSupabase;
  let repository: SupabaseSanctuaryRepository;

  beforeEach(() => {
    mockSupabase = {
      auth: {
        getUser: vi.fn(),
      },
      from: vi.fn(),
    };
    repository = new SupabaseSanctuaryRepository(mockSupabase as unknown as SupabaseClient);
  });

  it('should throw an error if the user is not authenticated (Negative Case)', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    await expect(repository.getLearningHierarchy()).rejects.toThrow('User is not authenticated');
  });

  it('should return mapped hierarchy successfully when user is authenticated (Positive Case)', async () => {
    const mockUser = { id: 'user-777' };
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });

    const mockDbData = [
      {
        id: 'grimoire-1',
        owner_id: 'user-777',
        title: 'Grimório de Astromancia',
        notebooks: [
          {
            id: 'notebook-1',
            grimoire_id: 'grimoire-1',
            title: 'Constelações',
            position: 1,
            chapters: [
              {
                id: 'chapter-1',
                notebook_id: 'notebook-1',
                title: 'Capítulo Alfa',
                position: 1,
                pages: [
                  {
                    id: 'page-1',
                    chapter_id: 'chapter-1',
                    title: 'Estrela Guia',
                    position: 1,
                  }
                ]
              }
            ]
          }
        ]
      }
    ];

    const mockQueryBuilder: MockQueryBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      returns: vi.fn().mockResolvedValue({ data: mockDbData, error: null }),
    };

    mockSupabase.from.mockReturnValue(mockQueryBuilder);

    const result = await repository.getLearningHierarchy();

    expect(mockSupabase.from).toHaveBeenCalledWith('grimoires');
    expect(mockQueryBuilder.eq).toHaveBeenCalledWith('owner_id', 'user-777');

    // Verificar que a consulta usa os campos esperados e NÃO inclui content/description
    const selectCall = mockQueryBuilder.select.mock.calls[0][0];
    expect(selectCall).toContain('id');
    expect(selectCall).toContain('owner_id');
    expect(selectCall).toContain('notebooks');
    expect(selectCall).not.toContain('content');
    expect(selectCall).not.toContain('description');

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('grimoire-1');
    expect(result[0].ownerId).toBe('user-777');
    expect(result[0].notebooks[0].chapters[0].pages[0].title).toBe('Estrela Guia');
  });

  it('should correctly sort elements at all levels (notebooks, chapters, pages)', async () => {
    const mockUser = { id: 'user-777' };
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });

    const mockDbData = [
      {
        id: 'grimoire-1',
        owner_id: 'user-777',
        title: 'G1',
        notebooks: [
          { 
            id: 'n2', position: 2, 
            chapters: [
              { 
                id: 'c2', position: 2, 
                pages: [{ id: 'p2', position: 2 }, { id: 'p1', position: 1 }] 
              },
              { id: 'c1', position: 1, pages: [] }
            ] 
          },
          { id: 'n1', position: 1, chapters: [] },
        ]
      }
    ];

    const mockQueryBuilder: MockQueryBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      returns: vi.fn().mockResolvedValue({ data: mockDbData, error: null }),
    };
    mockSupabase.from.mockReturnValue(mockQueryBuilder);

    const result = await repository.getLearningHierarchy();

    // Ordenação de Notebooks
    expect(result[0].notebooks[0].id).toBe('n1');
    expect(result[0].notebooks[1].id).toBe('n2');

    // Ordenação de Chapters (dentro de n2)
    expect(result[0].notebooks[1].chapters[0].id).toBe('c1');
    expect(result[0].notebooks[1].chapters[1].id).toBe('c2');

    // Ordenação de Pages (dentro de c2)
    expect(result[0].notebooks[1].chapters[1].pages[0].id).toBe('p1');
    expect(result[0].notebooks[1].chapters[1].pages[1].id).toBe('p2');
  });

  it('should bubble up database errors appropriately', async () => {
    const mockUser = { id: 'user-777' };
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });

    const mockQueryBuilder: MockQueryBuilder = { 
      select: vi.fn().mockReturnThis(), 
      eq: vi.fn().mockReturnThis(),
      returns: vi.fn().mockResolvedValue({ data: null, error: { message: 'RLS Violation or Connection Timeout' } }) 
    };
    mockSupabase.from.mockReturnValue(mockQueryBuilder);

    await expect(repository.getLearningHierarchy()).rejects.toThrow('Failed to fetch learning hierarchy: RLS Violation or Connection Timeout');
  });
});