from fastapi import APIRouter, status

from app.api.dependencies import SessionDep
from app.modules.auth.dependencies import CurrentUserDep
from app.modules.notifications.models import DevicePushToken
from app.modules.notifications.schemas import DeviceTokenCreate, DeviceTokenResponse
from app.modules.notifications.service import register_device

router = APIRouter()


@router.post(
    "/devices", response_model=DeviceTokenResponse, status_code=status.HTTP_201_CREATED
)
def register_device_endpoint(
    data: DeviceTokenCreate, session: SessionDep, current_user: CurrentUserDep
) -> DeviceTokenResponse:
    return register_device(session, current_user.id, data)


@router.patch("/devices/{device_id}", response_model=DeviceTokenResponse)
def update_device_endpoint(
    device_id: str,
    data: DeviceTokenCreate,
    session: SessionDep,
    current_user: CurrentUserDep,
) -> DeviceTokenResponse:
    from fastapi import HTTPException
    from sqlalchemy import select

    if data.device_id != device_id:
        raise HTTPException(status_code=400, detail="Cihaz kimliği eşleşmiyor.")
    device = session.scalar(
        select(DevicePushToken).where(
            DevicePushToken.user_id == current_user.id,
            DevicePushToken.device_id == device_id,
        )
    )
    if device is None:
        raise HTTPException(status_code=404, detail="Cihaz bulunamadı.")
    device.platform = data.platform
    device.push_token = data.push_token
    device.is_active = True
    session.commit()
    session.refresh(device)
    return device


@router.delete("/devices/{device_id}", status_code=status.HTTP_204_NO_CONTENT)
def deactivate_device_endpoint(
    device_id: str, session: SessionDep, current_user: CurrentUserDep
) -> None:
    from sqlalchemy import select

    device = session.scalar(
        select(DevicePushToken).where(
            DevicePushToken.user_id == current_user.id,
            DevicePushToken.device_id == device_id,
        )
    )
    if device is not None:
        device.is_active = False
        session.commit()
