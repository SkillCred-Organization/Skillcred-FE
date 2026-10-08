import {
  Award,
  Check,
  FolderGit2,
  Star,
  Trophy,
  type LucideIcon,
} from "lucide-react";

interface ProfileItem {
  label: string;
  Icon: LucideIcon;
  iconBackground: string;
  iconColor: string;
}

const profileItems: ProfileItem[] = [
  {
    label: "Projects",
    Icon: FolderGit2,
    iconBackground: "#FFE8D7",
    iconColor: "#65361D",
  },
  {
    label: "Certifications",
    Icon: Award,
    iconBackground: "#E6F2D9",
    iconColor: "#3A4828",
  },
  {
    label: "Skills",
    Icon: Star,
    iconBackground: "#F8E3FE",
    iconColor: "#5D2B6B",
  },
  {
    label: "Achievements",
    Icon: Trophy,
    iconBackground: "#DFEDFF",
    iconColor: "#004284",
  },
];

export default function ProfileCard() {
  return (
    <div className="absolute bottom-0 left-[-100px] z-20 flex h-[230px] w-[220px] flex-col gap-[8px] rounded-[16px] bg-white p-3 shadow-[0px_14px_30px_rgba(38,23,13,0.16)]">
      <div className="flex h-10 items-center gap-[9px]">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FFE8D7] text-[11px] font-semibold text-[#65361D]">
          AO
        </div>

        <div className="flex flex-col">
          <p className="text-[14px] font-medium leading-5 text-[#26160E]">
            Adaeze Okafor
          </p>

          <p className="text-[12px] leading-4 text-[#63554D]">
            Backend Engineer
          </p>
        </div>
      </div>

      {profileItems.map(
        ({ label, Icon, iconBackground, iconColor }) => (
          <div
            key={label}
            className="flex h-[36px] w-full items-center gap-[8px] rounded-[9px] bg-[#FFF9F6] px-2 py-1"
          >
            <div
              className="flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-[7px]"
              style={{ backgroundColor: iconBackground }}
            >
              <Icon
                size={13}
                strokeWidth={1.7}
                style={{ color: iconColor }}
              />
            </div>

            <span className="flex-1 text-[13px] leading-5 text-[#26160E]">
              {label}
            </span>

            <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-[#46820B]">
              <Check
                size={11}
                strokeWidth={2}
                className="text-white"
              />
            </span>
          </div>
        ),
      )}
    </div>
  );
}