import { useState, useCallback, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { adminHeaders } from '@/config/adminApi';

const VK_PARSER_URL = 'https://functions.poehali.dev/27d46d11-5402-4428-b786-4d2eb3aace8b?endpoint=vk_parser';

interface City {
  id: number;
  title: string;
  region: string;
  area: string;
}

interface Region {
  id: number;
  title: string;
}

interface GroupResult {
  id: number;
  name: string;
  screen_name: string;
  url: string;
  photo: string;
  members_count: number;
  city: string;
  description: string;
  emails: string[];
  is_closed: number;
}

const VkCommunityParserTab = () => {
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [locationMode, setLocationMode] = useState<'city' | 'region'>('city');
  const [cityQuery, setCityQuery] = useState('');
  const [cityOptions, setCityOptions] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [regionQuery, setRegionQuery] = useState('');
  const [regionOptions, setRegionOptions] = useState<Region[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [showRegionDropdown, setShowRegionDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<GroupResult[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [offset, setOffset] = useState(0);
  const [onlyWithEmail, setOnlyWithEmail] = useState(false);
  const cityInputRef = useRef<HTMLDivElement>(null);
  const regionInputRef = useRef<HTMLDivElement>(null);

  const COUNT = 100;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (cityInputRef.current && !cityInputRef.current.contains(e.target as Node)) {
        setShowCityDropdown(false);
      }
      if (regionInputRef.current && !regionInputRef.current.contains(e.target as Node)) {
        setShowRegionDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchCities = useCallback(async (q: string) => {
    if (!q.trim()) {
      setCityOptions([]);
      return;
    }
    try {
      const res = await fetch(`${VK_PARSER_URL}&action=cities&q=${encodeURIComponent(q.trim())}`, { headers: adminHeaders() });
      const data = await res.json();
      setCityOptions(data.cities || []);
    } catch {
      setCityOptions([]);
    }
  }, []);

  const searchRegions = useCallback(async (q: string) => {
    if (!q.trim()) {
      setRegionOptions([]);
      return;
    }
    try {
      const res = await fetch(`${VK_PARSER_URL}&action=regions&q=${encodeURIComponent(q.trim())}`, { headers: adminHeaders() });
      const data = await res.json();
      setRegionOptions(data.regions || []);
    } catch {
      setRegionOptions([]);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchCities(cityQuery), 350);
    return () => clearTimeout(timer);
  }, [cityQuery, searchCities]);

  useEffect(() => {
    const timer = setTimeout(() => searchRegions(regionQuery), 350);
    return () => clearTimeout(timer);
  }, [regionQuery, searchRegions]);

  const runSearch = async (nextOffset: number, append: boolean) => {
    if (!query.trim()) {
      toast({ title: 'Укажите ключевые слова для поиска', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${VK_PARSER_URL}&action=search`, {
        method: 'POST',
        headers: adminHeaders(),
        body: JSON.stringify({
          query: query.trim(),
          city_id: locationMode === 'city' ? selectedCity?.id : undefined,
          region_id: locationMode === 'region' ? selectedRegion?.id : undefined,
          count: COUNT,
          offset: nextOffset,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: 'Ошибка', description: data.error || 'Не удалось выполнить поиск', variant: 'destructive' });
        return;
      }
      setGroups(prev => append ? [...prev, ...(data.groups || [])] : (data.groups || []));
      setTotalCount(data.total_count || 0);
      setOffset(nextOffset);
    } catch {
      toast({ title: 'Ошибка соединения', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setGroups([]);
    runSearch(0, false);
  };

  const handleLoadMore = () => {
    runSearch(offset + COUNT, true);
  };

  const visibleGroups = onlyWithEmail ? groups.filter(g => g.emails.length > 0) : groups;
  const groupsWithEmailCount = groups.filter(g => g.emails.length > 0).length;

  const handleExport = () => {
    if (visibleGroups.length === 0) {
      toast({ title: 'Нет данных для экспорта', variant: 'destructive' });
      return;
    }
    const rows = visibleGroups.map(g => ({
      'Название': g.name,
      'Ссылка': g.url,
      'Город': g.city,
      'Участников': g.members_count,
      'Email': g.emails.join(', '),
      'Закрытая группа': g.is_closed ? 'Да' : 'Нет',
      'Описание': g.description,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [{ wch: 40 }, { wch: 30 }, { wch: 18 }, { wch: 12 }, { wch: 30 }, { wch: 14 }, { wch: 50 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Сообщества ВК');
    const fileName = `vk_communities_${query.trim().replace(/[^a-zа-яё0-9]+/gi, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-heading font-bold mb-2">Парсер сообществ ВК</h2>
        <p className="text-muted-foreground">
          Поиск сообществ по ключевым словам и городу/региону, автоматический сбор email из описания и контактов группы, экспорт результатов в Excel.
        </p>
      </div>

      <Card className="p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-end mb-3">
          <div>
            <label className="block text-sm font-medium mb-2">Ключевые слова</label>
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Например: танцевальная студия"
            />
          </div>

          <div className="flex gap-2 items-end">
            <div className="flex-1">
              {locationMode === 'city' ? (
                <div className="relative" ref={cityInputRef}>
                  <label className="block text-sm font-medium mb-2">Город</label>
                  <Input
                    value={selectedCity ? selectedCity.title : cityQuery}
                    onChange={e => {
                      setSelectedCity(null);
                      setCityQuery(e.target.value);
                      setShowCityDropdown(true);
                    }}
                    onFocus={() => setShowCityDropdown(true)}
                    placeholder="Любой город"
                  />
                  {showCityDropdown && cityOptions.length > 0 && (
                    <div className="absolute z-10 top-full mt-1 w-full bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {cityOptions.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                          onClick={() => {
                            setSelectedCity(c);
                            setCityQuery('');
                            setShowCityDropdown(false);
                          }}
                        >
                          {c.title}
                          {c.region && <span className="text-muted-foreground"> · {c.region}</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative" ref={regionInputRef}>
                  <label className="block text-sm font-medium mb-2">Регион / область / край</label>
                  <Input
                    value={selectedRegion ? selectedRegion.title : regionQuery}
                    onChange={e => {
                      setSelectedRegion(null);
                      setRegionQuery(e.target.value);
                      setShowRegionDropdown(true);
                    }}
                    onFocus={() => setShowRegionDropdown(true)}
                    placeholder="Например: Свердловская область"
                  />
                  {showRegionDropdown && regionOptions.length > 0 && (
                    <div className="absolute z-10 top-full mt-1 w-full bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {regionOptions.map(r => (
                        <button
                          key={r.id}
                          type="button"
                          className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                          onClick={() => {
                            setSelectedRegion(r);
                            setRegionQuery('');
                            setShowRegionDropdown(false);
                          }}
                        >
                          {r.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <Button
              type="button"
              variant="outline"
              size="icon"
              title={locationMode === 'city' ? 'Искать по региону вместо города' : 'Искать по городу вместо региона'}
              onClick={() => {
                setLocationMode(m => (m === 'city' ? 'region' : 'city'));
                setSelectedCity(null);
                setCityQuery('');
                setSelectedRegion(null);
                setRegionQuery('');
              }}
            >
              <Icon name="RefreshCw" size={16} />
            </Button>
          </div>

          <Button onClick={handleSearch} disabled={loading} className="bg-secondary hover:bg-secondary/90">
            {loading && offset === 0 ? <Icon name="Loader2" size={16} className="mr-2 animate-spin" /> : <Icon name="Search" size={16} className="mr-2" />}
            Найти
          </Button>
        </div>
        {locationMode === 'region' && (
          <p className="text-xs text-muted-foreground">
            Поиск по региону обходит все крупные города субъекта — может занять больше времени, чем поиск по одному городу.
          </p>
        )}
      </Card>

      {groups.length > 0 && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="outline">Найдено всего: {totalCount}</Badge>
              <Badge variant="outline">Загружено: {groups.length}</Badge>
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">С email: {groupsWithEmailCount}</Badge>
              <Button
                size="sm"
                variant={onlyWithEmail ? 'default' : 'outline'}
                onClick={() => setOnlyWithEmail(v => !v)}
              >
                <Icon name="Mail" size={14} className="mr-1.5" />
                Только с email
              </Button>
            </div>
            <Button onClick={handleExport} variant="outline" className="gap-2">
              <Icon name="FileSpreadsheet" size={16} />
              Экспорт в Excel
            </Button>
          </div>

          <Card className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Сообщество</TableHead>
                  <TableHead>Город</TableHead>
                  <TableHead className="text-center">Участников</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Ссылка</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleGroups.map(g => (
                  <TableRow key={g.id}>
                    <TableCell className="font-medium max-w-[280px]">
                      <div className="flex items-center gap-2">
                        {g.photo && <img src={g.photo} alt="" className="w-8 h-8 rounded-full shrink-0" />}
                        <span className="truncate">{g.name}</span>
                        {!!g.is_closed && <Icon name="Lock" size={12} className="text-muted-foreground shrink-0" />}
                      </div>
                    </TableCell>
                    <TableCell>{g.city || '—'}</TableCell>
                    <TableCell className="text-center">{g.members_count.toLocaleString('ru-RU')}</TableCell>
                    <TableCell>
                      {g.emails.length > 0 ? (
                        <div className="flex flex-col gap-0.5">
                          {g.emails.map(e => (
                            <a key={e} href={`mailto:${e}`} className="text-sm text-secondary hover:underline">{e}</a>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <a href={g.url} target="_blank" rel="noreferrer" className="text-secondary hover:underline text-sm inline-flex items-center gap-1">
                        Открыть <Icon name="ExternalLink" size={12} />
                      </a>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {groups.length < totalCount && (
            <div className="flex justify-center mt-4">
              <Button variant="outline" onClick={handleLoadMore} disabled={loading}>
                {loading ? <Icon name="Loader2" size={16} className="mr-2 animate-spin" /> : <Icon name="ChevronDown" size={16} className="mr-2" />}
                Загрузить ещё
              </Button>
            </div>
          )}
        </>
      )}

      {!loading && groups.length === 0 && query && (
        <Card className="p-12 text-center text-muted-foreground">
          <Icon name="SearchX" size={32} className="mx-auto mb-2 opacity-40" />
          Ничего не найдено, попробуйте изменить запрос
        </Card>
      )}
    </div>
  );
};

export default VkCommunityParserTab;