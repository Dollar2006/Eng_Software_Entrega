from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.dependencies import get_current_user
from app.models.game import Game
from app.models.list import List, ListItem
from app.schema.list import (
    GameStatusOut,
    ListItemOut,
    ListRefOut,
    SetStatusIn,
    SystemListsOut,
)

router = APIRouter(prefix="/users/me/lists", tags=["lists"])

SYSTEM_LISTS = {
    "played": "Jogados",
    "want_to_play": "Pretendo Jogar",
    "library": "Biblioteca",
}


def _current_user_id(user: dict[str, str]) -> UUID:
    try:
        return UUID(user["id"])
    except (KeyError, TypeError, ValueError) as error:
        raise HTTPException(status_code=401, detail="Sessão inválida") from error


def _ensure_system_lists(db: Session, user_id: UUID) -> list[List]:
    lists = (
        db.query(List)
        .filter(List.user_id == user_id, List.kind == "system")
        .order_by(List.id)
        .all()
    )
    existing = {l.name: l for l in lists}
    created = False
    for slug, name in SYSTEM_LISTS.items():
        if name not in existing:
            lst = List(user_id=user_id, name=name, kind="system")
            db.add(lst)
            created = True
    if created:
        db.commit()
        lists = (
            db.query(List)
            .filter(List.user_id == user_id, List.kind == "system")
            .order_by(List.id)
            .all()
        )
        return lists
    return lists


@router.get("", response_model=SystemListsOut)
def get_my_lists(
    user: dict[str, str] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    uid = _current_user_id(user)
    lists = _ensure_system_lists(db, uid)
    return {"lists": [ListRefOut.model_validate(l) for l in lists]}


@router.get("/game/{game_id}/status", response_model=GameStatusOut)
def get_game_status(
    game_id: int,
    user: dict[str, str] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if db.get(Game, game_id) is None:
        raise HTTPException(status_code=404, detail="Jogo não encontrado")
    uid = _current_user_id(user)
    lists = _ensure_system_lists(db, uid)
    by_name = {l.name: l for l in lists}
    item = (
        db.query(ListItem)
        .filter(
            ListItem.game_id == game_id,
            ListItem.list_id.in_([l.id for l in lists]),
        )
        .first()
    )
    if item is None:
        return {"status": None}
    status = None
    for slug, name in SYSTEM_LISTS.items():
        l = by_name.get(name)
        if l and item.list_id == l.id:
            status = slug
            break
    return {"status": status}


@router.put("/status", response_model=GameStatusOut)
def set_game_status(
    payload: SetStatusIn,
    user: dict[str, str] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if db.get(Game, payload.game_id) is None:
        raise HTTPException(status_code=404, detail="Jogo não encontrado")
    uid = _current_user_id(user)
    lists = _ensure_system_lists(db, uid)
    by_name = {l.name: l for l in lists}
    target_name = SYSTEM_LISTS.get(payload.status)
    target = by_name.get(target_name) if target_name else None
    (
        db.query(ListItem)
        .filter(
            ListItem.game_id == payload.game_id,
            ListItem.list_id.in_(
                db.query(List.id)
                .filter(List.user_id == uid, List.kind == "system")
                .subquery()
                .select()
            ),
        )
        .delete(synchronize_session=False)
    )
    if target is not None:
        db.add(ListItem(list_id=target.id, game_id=payload.game_id))
    db.commit()
    return {"status": payload.status}


@router.delete("/status", response_model=GameStatusOut)
def remove_game_status(
    game_id: int = Query(...),
    user: dict[str, str] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if db.get(Game, game_id) is None:
        raise HTTPException(status_code=404, detail="Jogo não encontrado")
    uid = _current_user_id(user)
    lists = _ensure_system_lists(db, uid)
    (
        db.query(ListItem)
        .filter(
            ListItem.game_id == game_id,
            ListItem.list_id.in_(
                db.query(List.id).filter(List.user_id == uid, List.kind == "system").subquery()
            ),
        )
        .delete(synchronize_session=False)
    )
    db.commit()
    return {"status": None}


@router.get("/{list_id}/items", response_model=list[ListItemOut])
def list_items(
    list_id: int,
    user: dict[str, str] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    uid = _current_user_id(user)
    lst = db.get(List, list_id)
    if lst is None or lst.user_id != uid:
        raise HTTPException(status_code=404, detail="Lista não encontrada")
    items = db.query(ListItem).filter(ListItem.list_id == list_id).order_by(ListItem.added_at.desc()).all()
    return items
