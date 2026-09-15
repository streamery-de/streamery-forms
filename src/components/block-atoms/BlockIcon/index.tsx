import { LucideIcon } from "lucide-react";
import './styles.css';
import clsx from "clsx";

type BlockIconProps = {
	icon: LucideIcon;
	clean?: boolean;
};

const BlockIcon = ({icon, clean}: BlockIconProps) => {
    const Icon = icon;
	return (
			<div className={clsx('streamery-forms-block-icon', clean && 'clean')}>
			<Icon />
		</div>
	);
};

export default BlockIcon;