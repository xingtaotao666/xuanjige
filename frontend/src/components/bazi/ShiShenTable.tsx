import type { ShiShenItem } from '@/types/bazi';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ShiShenTableProps {
  items: ShiShenItem[];
}

const ganColor = (gan: string) => {
  const wood = '甲乙';
  const fire = '丙丁';
  const earth = '戊己';
  const metal = '庚辛';
  const water = '壬癸';
  if (wood.includes(gan)) return 'text-emerald-400';
  if (fire.includes(gan)) return 'text-red-400';
  if (earth.includes(gan)) return 'text-amber-400';
  if (metal.includes(gan)) return 'text-gray-200';
  if (water.includes(gan)) return 'text-blue-400';
  return 'text-gray-300';
};

export default function ShiShenTable({ items }: ShiShenTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table className="min-w-[360px]">
        <TableHeader>
          <TableRow className="border-bronze/25 hover:bg-transparent">
            <TableHead className="text-inkstone-soft">天干</TableHead>
            <TableHead className="text-inkstone-soft">十神</TableHead>
            <TableHead className="text-inkstone-soft">现代解读</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow className="border-bronze/25 hover:bg-transparent">
              <TableCell colSpan={3} className="text-center text-inkstone-soft">
                暂无十神数据
              </TableCell>
            </TableRow>
          ) : (
            items.map((item, i) => (
              <TableRow key={i} className="border-bronze/20 hover:bg-bronze/5">
                <TableCell className={`font-bold ${ganColor(item.gan)}`}>
                  {item.gan}
                </TableCell>
                <TableCell className="text-inkstone/90">{item.shishen}</TableCell>
                <TableCell className="text-sm text-inkstone-soft">
                  {item.modern_roles && item.modern_roles.length > 0
                    ? item.modern_roles.join('、')
                    : '—'}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
