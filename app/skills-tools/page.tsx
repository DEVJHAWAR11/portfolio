import { Icons } from '@/components/icons';
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading,
} from '@/components/page-header';
import Pager from '@/components/pager';
import { Badge } from '@/components/ui/badge';
import { mySkills } from '@/constants';

const SkillsToolsPage = () => {
  return (
    <>
      <PageHeader>
        <PageHeaderHeading>Skills & Tools</PageHeaderHeading>
        <PageHeaderHeading className="mt-2 text-muted-foreground">
          Learned by coding all night and debugging all day!
        </PageHeaderHeading>
        <PageHeaderDescription>
          As an AI and Backend Engineer, I specialize in building intelligent, scalable systems
          using modern technologies such as Python, FastAPI, and PyTorch. I am continuously 
          expanding my expertise into machine learning, cloud architecture, and distributed 
          system design to create robust, high-performance solutions.
        </PageHeaderDescription>
      </PageHeader>

      {/* skills and tools badges */}
      <div
        id="badges"
        className="flex flex-wrap items-center justify-center gap-2 my-4"
      >
        {mySkills.map((item) => (
          <Badge
            key={item.title}
            className="p-4 py-2 border border-secondary bg-secondary-foreground text-secondary"
          >
            {Icons[item.icon as keyof typeof Icons]?.({
              className: 'mr-2 size-4',
            })}
            {item.title}
          </Badge>
        ))}
      </div>

      <Pager
        prevHref="/projects"
        nextHref="/education"
        prevTitle="Projects"
        nextTitle="Education"
      />
    </>
  );
};
export default SkillsToolsPage;
