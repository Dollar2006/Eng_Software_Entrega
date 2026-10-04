from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.dependencies import get_current_user
from app.models.game import Game
from app.models.list import List, ListItem
from app.schema.list import (
    GameStatusOut,
    AddListItemIn,
    CreateListIn,
    ListItemOut,
    ListRefOut,
    ListsOut,
    SetStatusIn,
    UpdateListIn,
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


@router.get("", response_model=ListsOut)
def get_my_lists(
    user: dict[str, str] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    uid = _current_user_id(user)
    _ensure_system_lists(db, uid)
    lists = db.query(List).filter(List.user_id == uid).order_by(List.id).all()
    return {"lists": [ListRefOut.model_validate(l) for l in lists]}


@router.post("", response_model=ListRefOut, status_code=status.HTTP_201_CREATED)
def create_custom_list(
    payload: CreateListIn,
    user: dict[str, str] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    uid = _current_user_id(user)
    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=422, detail="O nome da lista é obrigatório")
    if db.query(List).filter(List.user_id == uid, List.name == name).first():
        raise HTTPException(status_code=409, detail="Já existe uma lista com esse nome")
    lst = List(user_id=uid, name=name, kind="custom")
    db.add(lst)
    db.commit()
    db.refresh(lst)
    return lst


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


@router.delete("/{list_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_custom_list(
    list_id: int,
    user: dict[str, str] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    uid = _current_user_id(user)
    lst = db.get(List, list_id)
    if lst is None or lst.user_id != uid or lst.kind != "custom":
        raise HTTPException(status_code=404, detail="Lista personalizada não encontrada")
    db.delete(lst)
    db.commit()


@router.patch("/{list_id}", response_model=ListRefOut)
def update_custom_list(
    list_id: int,
    payload: UpdateListIn,
    user: dict[str, str] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    uid = _current_user_id(user)
    lst = db.get(List, list_id)
    if lst is None or lst.user_id != uid or lst.kind != "custom":
        raise HTTPException(status_code=404, detail="Lista personalizada não encontrada")
    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=422, detail="O nome da lista é obrigatório")
    duplicate = (
        db.query(List)
        .filter(List.user_id == uid, List.name == name, List.id != list_id)
        .first()
    )
    if duplicate is not None:
        raise HTTPException(status_code=409, detail="Já existe uma lista com esse nome")
    lst.name = name
    db.commit()
    db.refresh(lst)
    return lst


@router.put("/{list_id}/items", response_model=ListItemOut)
def add_list_item(
    list_id: int,
    payload: AddListItemIn,
    user: dict[str, str] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    uid = _current_user_id(user)
    lst = db.get(List, list_id)
    if lst is None or lst.user_id != uid or lst.kind != "custom":
        raise HTTPException(status_code=404, detail="Lista personalizada não encontrada")
    if db.get(Game, payload.game_id) is None:
        raise HTTPException(status_code=404, detail="Jogo não encontrado")
    item = (
        db.query(ListItem)
        .filter(ListItem.list_id == list_id, ListItem.game_id == payload.game_id)
        .first()
    )
    if item is None:
        item = ListItem(list_id=list_id, game_id=payload.game_id)
        db.add(item)
        db.commit()
        db.refresh(item)
    return item


@router.delete("/{list_id}/items/{game_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_list_item(
    list_id: int,
    game_id: int,
    user: dict[str, str] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    uid = _current_user_id(user)
    lst = db.get(List, list_id)
    if lst is None or lst.user_id != uid or lst.kind != "custom":
        raise HTTPException(status_code=404, detail="Lista personalizada não encontrada")
    item = (
        db.query(ListItem)
        .filter(ListItem.list_id == list_id, ListItem.game_id == game_id)
        .first()
    )
    if item is None:
        raise HTTPException(status_code=404, detail="Jogo não está na lista")
    db.delete(item)
    db.commit()
