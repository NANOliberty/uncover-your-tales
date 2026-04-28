import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { useSession } from '../features/auth/useSession';
import { useCreateGroup } from '../features/groups/mutations';
import { isValidSlug, suggestSlug } from '../features/groups/slug';

const formSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, '이름을 입력하세요')
    .max(60, '60자 이하로 입력하세요'),
  slug: z
    .string()
    .trim()
    .min(3, '3자 이상 입력하세요')
    .max(40, '40자 이하로 입력하세요')
    .refine(isValidSlug, {
      message: '소문자·숫자·하이픈만 가능합니다 (예: saturday-table)',
    }),
  description: z
    .string()
    .trim()
    .max(500, '500자 이하로 입력하세요')
    .optional()
    .or(z.literal('')),
});

type FormValues = z.infer<typeof formSchema>;

export function CreateGroupPage() {
  const navigate = useNavigate();
  const { user } = useSession();
  const createGroup = useCreateGroup();

  const [slugTouched, setSlugTouched] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: { name: '', slug: '', description: '' },
  });

  const name = watch('name');
  const slug = watch('slug');

  // 사용자가 슬러그 필드를 직접 만지기 전까지는 이름에서 자동 생성.
  // 한글 등 ASCII 가 아닌 이름은 결과가 비어 사용자가 직접 입력해야 함 — 이때 힌트를 보여준다.
  useEffect(() => {
    if (!slugTouched) {
      setValue('slug', suggestSlug(name ?? ''), { shouldValidate: false });
    }
  }, [name, slugTouched, setValue]);

  const needsManualSlug =
    !slugTouched && !!name && name.trim().length > 0 && (!slug || slug.length < 3);

  const onSubmit = handleSubmit(async (values) => {
    if (!user) {
      toast.error('로그인 세션이 만료되었습니다');
      navigate('/auth/login');
      return;
    }

    try {
      const group = await createGroup.mutateAsync({
        name: values.name,
        slug: values.slug,
        description: values.description?.trim() || null,
        createdBy: user.id,
      });
      toast.success(`"${group.name}" 그룹이 만들어졌어요`);
      navigate(`/g/${group.slug}`);
    } catch (e) {
      const code = (e as { code?: string })?.code;
      const msg = e instanceof Error ? e.message : '알 수 없는 오류';
      if (code === '23505' || msg.includes('groups_slug_key')) {
        setError('slug', { message: '이미 사용 중인 주소입니다' });
      } else if (msg.includes('groups_slug_check')) {
        setError('slug', { message: '주소 형식이 올바르지 않습니다' });
      } else {
        toast.error(`그룹 생성 실패: ${msg}`);
      }
    }
  });

  return (
    <div className="mx-auto max-w-xl px-6 py-10">
      <header className="mb-6">
        <p className="text-sm text-muted-foreground">새 그룹</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">그룹 만들기</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          만든 즉시 관리자가 됩니다. 친구들은 초대 코드로 합류시킵니다.
        </p>
      </header>

      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="name">그룹 이름</Label>
          <Input id="name" placeholder="예: 토요일의 식탁" autoFocus {...register('name')} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="slug">URL 주소</Label>
          <div className="flex items-center gap-1 rounded-md border bg-input-background px-3 focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
            <span className="text-sm text-muted-foreground">/g/</span>
            <input
              id="slug"
              className="flex-1 bg-transparent py-2 text-sm outline-none"
              placeholder="saturday-table"
              {...register('slug', {
                onChange: () => setSlugTouched(true),
              })}
            />
          </div>
          {errors.slug ? (
            <p className="text-xs text-destructive">{errors.slug.message}</p>
          ) : needsManualSlug ? (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              한글 이름은 자동으로 영문 주소를 만들 수 없습니다. 직접 입력해 주세요.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              소문자·숫자·하이픈, 3~40자. 그룹 페이지 URL 에 사용됩니다.
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">소개 (선택)</Label>
          <Textarea
            id="description"
            placeholder="우리 그룹은 어떤 테이블인가요?"
            rows={3}
            {...register('description')}
          />
          {errors.description && (
            <p className="text-xs text-destructive">{errors.description.message}</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={() => navigate('/groups')}>
            취소
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? '만드는 중…' : '그룹 만들기'}
          </Button>
        </div>
      </form>
    </div>
  );
}
