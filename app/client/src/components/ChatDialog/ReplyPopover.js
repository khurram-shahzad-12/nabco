import Popover from '@mui/material/Popover';
import { Box, Button } from '@mui/material';

const ReplyPopover = ({menuAnchorE1, setMenuAnchorE1, selectedMessageForAction, setReplyTo, disableEnforceFocus}) => {
    return (
        <Popover
            open={Boolean(menuAnchorE1)}
            anchorEl={menuAnchorE1}
            onClose={() => setMenuAnchorE1(null)}
            disableEnforceFocus={disableEnforceFocus}
            disableAutoFocus
            disablePortal
        >
            <Box sx={{ p: 1 }}>
                <Button size='small' onClick={() => { setReplyTo(selectedMessageForAction); setMenuAnchorE1(null) }}> Reply</Button>
            </Box>
        </Popover>
    )
}

export default ReplyPopover