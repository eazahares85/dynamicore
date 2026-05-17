import random
from decimal import Decimal

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(
    title="Dynamicore Payment Processor",
    version="1.0.0",
)

APPROVAL_RATE = 0.8


class ProcessPaymentRequest(BaseModel):
    monto: Decimal = Field(..., gt=0)


class ProcessPaymentResponse(BaseModel):
    aprobado: bool
    estado: str
    mensaje: str


@app.get("/health")
def health():
    return {"status": "ok", "service": "payment-processor"}


@app.post("/process", response_model=ProcessPaymentResponse)
def process_payment(body: ProcessPaymentRequest):
    if body.monto <= 0:
        raise HTTPException(status_code=400, detail="El monto debe ser mayor a cero")

    aprobado = random.random() < APPROVAL_RATE
    estado = "aprobado" if aprobado else "rechazado"
    mensaje = (
        "Pago procesado correctamente"
        if aprobado
        else "Pago rechazado por el procesador"
    )

    return ProcessPaymentResponse(aprobado=aprobado, estado=estado, mensaje=mensaje)
